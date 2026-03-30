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
    return new NextResponse('No resume found', { status: 404 })
  }

  const resumeUrl = candidate.resumeUrl

  // Vercel Blob private URL — proxy it with the token
  if (resumeUrl.includes('blob.vercel-storage.com')) {
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
    if (!token) return new NextResponse('Storage not configured', { status: 500 })

    try {
      const blobRes = await fetch(resumeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!blobRes.ok) return new NextResponse('Resume not found', { status: 404 })

      const contentType = blobRes.headers.get('content-type') ?? 'application/pdf'
      const isDownload = req.nextUrl.searchParams.get('download') === '1'
      const disposition = isDownload ? 'attachment; filename="resume.pdf"' : 'inline; filename="resume.pdf"'

      return new NextResponse(blobRes.body, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': disposition,
        },
      })
    } catch (err) {
      console.error('Resume proxy error:', err)
      return new NextResponse('Failed to retrieve resume', { status: 500 })
    }
  }

  // Legacy local path — not available in production
  return new NextResponse('Resume not available', { status: 404 })
}
