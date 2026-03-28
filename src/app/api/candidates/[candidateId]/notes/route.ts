import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { candidateId: string } }) {
  const notes = await prisma.candidateNote.findMany({
    where: { candidateId: params.candidateId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest, { params }: { params: { candidateId: string } }) {
  const session = await getServerSession(authOptions)
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const note = await prisma.candidateNote.create({
    data: {
      candidateId: params.candidateId,
      content: content.trim(),
      authorId: (session?.user as any)?.id ?? null,
      authorName: session?.user?.name ?? session?.user?.email ?? 'Anonymous',
    },
  })
  return NextResponse.json(note, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { candidateId: string } }) {
  const { noteId } = await req.json()
  await prisma.candidateNote.deleteMany({
    where: { id: noteId, candidateId: params.candidateId },
  })
  return NextResponse.json({ ok: true })
}
