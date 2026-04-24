import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    select: { resumeUrl: true },
  })

  if (!candidate?.resumeUrl) {
    return new NextResponse('No resume on file', { status: 404 })
  }

  const resumeUrl = candidate.resumeUrl

  if (!resumeUrl.includes('blob.vercel-storage.com')) {
    return new NextResponse('Resume not available', { status: 404 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN

  try {
    // Helper: check if a fetch response looks like real file content
    // (not an HTML error/redirect page returned by Vercel for private blobs)
    const isRealFile = (res: Response) => {
      if (!res.ok) return false
      const ct = res.headers.get('content-type') ?? ''
      return !ct.includes('text/html')
    }

    let blobRes = await fetch(resumeUrl)

    // If the direct fetch returned HTML (e.g. Vercel auth wall for a private blob)
    // or a non-OK status, retry with the token.
    if (!isRealFile(blobRes) && token) {
      blobRes = await fetch(resumeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    if (!isRealFile(blobRes)) {
      console.error(`[resume] Blob fetch failed: ${blobRes.status} ${blobRes.statusText} ct=${blobRes.headers.get('content-type')}`)
      return new NextResponse('Resume file not found', { status: 404 })
    }

    const buffer = await blobRes.arrayBuffer()

    // Derive content-type from URL extension or fall back to the blob header
    const urlLower = resumeUrl.toLowerCase()
    let contentType: string
    if (urlLower.includes('.pdf')) {
      contentType = 'application/pdf'
    } else if (urlLower.includes('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (urlLower.includes('.doc')) {
      contentType = 'application/msword'
    } else {
      const blobCt = blobRes.headers.get('content-type') ?? 'application/octet-stream'
      // Don't propagate an HTML content-type
      contentType = blobCt.includes('text/html') ? 'application/octet-stream' : blobCt
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1'
    const ext = urlLower.includes('.docx') ? 'docx' : urlLower.includes('.doc') ? 'doc' : 'pdf'
    const disposition = isDownload
      ? `attachment; filename="resume.${ext}"`
      : `inline; filename="resume.${ext}"`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[resume] Proxy error:', err)
    return new NextResponse('Failed to retrieve resume', { status: 500 })
  }
}
