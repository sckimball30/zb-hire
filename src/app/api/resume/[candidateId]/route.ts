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

  try {
    // New uploads are public — fetch directly. Fall back to auth header for
    // any older blobs that were stored as private.
    let blobRes = await fetch(resumeUrl)

    if (!blobRes.ok) {
      const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
      if (token) {
        blobRes = await fetch(resumeUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    }

    if (!blobRes.ok) {
      console.error(`[resume] Blob fetch failed: ${blobRes.status} ${blobRes.statusText}`)
      return new NextResponse('Resume file not found', { status: 404 })
    }

    const buffer = await blobRes.arrayBuffer()

    let contentType = blobRes.headers.get('content-type') ?? 'application/pdf'
    if (resumeUrl.toLowerCase().includes('.pdf') || contentType === 'application/octet-stream') {
      contentType = 'application/pdf'
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1'
    const disposition = isDownload
      ? 'attachment; filename="resume.pdf"'
      : 'inline; filename="resume.pdf"'

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
