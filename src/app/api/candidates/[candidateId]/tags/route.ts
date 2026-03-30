import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { candidateId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { tagId } = await req.json()
  await prisma.candidateTag.upsert({
    where: { candidateId_tagId: { candidateId: params.candidateId, tagId } },
    create: { candidateId: params.candidateId, tagId },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { candidateId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { tagId } = await req.json()
  await prisma.candidateTag.delete({
    where: { candidateId_tagId: { candidateId: params.candidateId, tagId } },
  }).catch(() => {})
  return NextResponse.json({ ok: true })
}
