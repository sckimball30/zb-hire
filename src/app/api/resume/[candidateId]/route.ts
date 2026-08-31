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

  const isDownload = req.nextUrl.searchParams.get('download') === '1'
  // ?raw=1 streams the bytes same-origin so the client can read them with
  // fetch() — used to convert Word documents to HTML for inline preview.
  // A cross-origin redirect to the blob would be blocked by CORS.
  const isRaw = req.nextUrl.searchParams.get('raw') === '1'

  // For inline viewing, redirect the browser straight to the public blob URL.
  // This eliminates the server-side proxy hop and lets the browser/CDN serve
  // the PDF directly — no double-fetch, no content-type guessing issues.
  if (!isDownload && !isRaw) {
    return NextResponse.redirect(resumeUrl, 302)
  }

  // Downloads and raw reads both proxy the bytes: downloads so we can force
  // Content-Disposition: attachment with a clean filename, raw so the fetch
  // stays same-origin.
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN

  try {
    const isRealFile = (res: Response) => {
      if (!res.ok) return false
      const ct = res.headers.get('content-type') ?? ''
      return !ct.includes('text/html')
    }

    let blobRes = await fetch(resumeUrl)
    if (!isRealFile(blobRes) && token) {
      blobRes = await fetch(resumeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    if (!isRealFile(blobRes)) {
      console.error(`[resume] Download fetch failed: ${blobRes.status} ct=${blobRes.headers.get('content-type')}`)
      return new NextResponse('Resume file not found', { status: 404 })
    }

    const buffer = await blobRes.arrayBuffer()
    const urlLower = resumeUrl.toLowerCase()
    const ext = urlLower.includes('.docx') ? 'docx' : urlLower.includes('.doc') ? 'doc' : 'pdf'
    let contentType: string
    if (ext === 'pdf') {
      contentType = 'application/pdf'
    } else if (ext === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else {
      contentType = 'application/msword'
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': isRaw
          ? `inline; filename="resume.${ext}"`
          : `attachment; filename="resume.${ext}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[resume] Download proxy error:', err)
    return new NextResponse('Failed to retrieve resume', { status: 500 })
  }
}
