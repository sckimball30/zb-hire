import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findUnique({ where: { id: params.candidateId } })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  const fd = await req.formData()
  const file = fd.get('resume') as File | null
  if (!file || !file.size) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
    const safeName = (file.name || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')
    const buffer = Buffer.from(await file.arrayBuffer())
    const blob = await put(
      `resumes/${params.candidateId}-${Date.now()}-${safeName}`,
      buffer,
      { access: 'public', token, contentType: file.type || 'application/pdf' }
    )

    await prisma.candidate.update({
      where: { id: params.candidateId },
      data: { resumeUrl: blob.url },
    })

    return NextResponse.json({ resumeUrl: blob.url })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[resume upload]', msg)
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 })
  }
}
