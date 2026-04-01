import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function addBusinessDays(days: number): Date {
  const date = new Date()
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) added++ // skip Sun=0, Sat=6
  }
  return date
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { candidateId, subject, body, templateId, delayDays } = await req.json()

  if (!candidateId || !subject?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: 'candidateId, subject, and body are required' },
      { status: 400 }
    )
  }

  const parsedDelay = Number(delayDays)
  if (!Number.isInteger(parsedDelay) || parsedDelay < 1 || parsedDelay > 30) {
    return NextResponse.json(
      { error: 'delayDays must be an integer between 1 and 30' },
      { status: 400 }
    )
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } })
  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  const scheduledFor = addBusinessDays(parsedDelay)

  const scheduled = await prisma.scheduledMessage.create({
    data: {
      candidateId,
      subject: subject.trim(),
      body: body.trim(),
      templateId: templateId || null,
      scheduledFor,
      sentById: (session?.user as any)?.id ?? null,
      sentByName: session?.user?.name ?? session?.user?.email ?? null,
    },
  })

  return NextResponse.json({ ok: true, scheduledFor: scheduled.scheduledFor })
}
