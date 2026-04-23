import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { applicationId: string; eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId, eventId } = params
  const body = await req.json()
  const { interviewerId, type, scheduledAt, durationMins, location, notes } = body

  const existing = await prisma.interviewEvent.findUnique({
    where: { id: eventId },
  })
  if (!existing || existing.applicationId !== applicationId) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const isWorkingInterview = (type ?? existing.type) === 'WORKING_INTERVIEW'

  const updated = await prisma.interviewEvent.update({
    where: { id: eventId },
    data: {
      interviewerId: isWorkingInterview ? null : (interviewerId ?? existing.interviewerId),
      type: type ?? existing.type,
      scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : existing.scheduledAt,
      durationMins: durationMins ?? existing.durationMins,
      location: location !== undefined ? (location || null) : existing.location,
      notes: notes !== undefined ? (notes || null) : existing.notes,
    },
    include: { interviewer: true },
  })

  await prisma.activityLog.create({
    data: {
      applicationId,
      action: `Interview updated: ${updated.type.replace('_', ' ')}${updated.interviewer ? ` with ${updated.interviewer.name}` : ''}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { applicationId: string; eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId, eventId } = params

  const existing = await prisma.interviewEvent.findUnique({ where: { id: eventId } })
  if (!existing || existing.applicationId !== applicationId) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  await prisma.interviewEvent.delete({ where: { id: eventId } })

  await prisma.activityLog.create({
    data: {
      applicationId,
      action: `Interview removed: ${existing.type.replace('_', ' ')}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  return NextResponse.json({ ok: true })
}
