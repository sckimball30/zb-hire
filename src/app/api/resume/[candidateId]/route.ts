import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { head } from '@vercel/blob'

// Returns a short-lived signed URL for viewing a private resume blob
export async function GET(
  _req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    select: { resumeUrl: true },
  })

  if (!candidate?.resumeUrl) {
    return NextResponse.json({ error: 'No resume found' }, { status: 404 })
  }

  // If it's an old local path or already a public URL, return as-is
  if (!candidate.resumeUrl.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid resume URL' }, { status: 400 })
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
    // For private blobs, use the blob URL directly with the token to get a downloadable link
    // The blob URL itself works with the token for authenticated access
    const blobInfo = await head(candidate.resumeUrl, { token })
    return NextResponse.json({ url: blobInfo.downloadUrl })
  } catch {
    // Fallback — return the URL directly (may work if public or already signed)
    return NextResponse.json({ url: candidate.resumeUrl })
  }
}
