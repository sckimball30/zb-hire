import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { updateCalendarEvent, deleteCalendarEvent, buildEventDescription } from '@/lib/google-calendar'

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
    include: { interviewer: true },
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
    include: {
      interviewer: true,
      application: {
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          job: { select: { title: true } },
        },
      },
    },
  })

  await prisma.activityLog.create({
    data: {
      applicationId,
      action: `Interview updated: ${updated.type.replace('_', ' ')}${updated.interviewer ? ` with ${updated.interviewer.name}` : ''}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  // Update Google Calendar event if one was previously created and time is set
  const effectiveScheduledAt = scheduledAt !== undefined ? scheduledAt : existing.scheduledAt?.toISOString()
  const effectiveDurationMins = durationMins ?? existing.durationMins
  const effectiveInterviewer = updated.interviewer
  const googleEventId = existing.googleCalendarEventId

  if (googleEventId && effectiveInterviewer?.email && effectiveScheduledAt) {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
    const candidateName = `${updated.application.candidate.firstName} ${updated.application.candidate.lastName}`
    const jobTitle = updated.application.job.title
    const typeLabel = INTERVIEW_TYPE_LABELS[updated.type as keyof typeof INTERVIEW_TYPE_LABELS] ?? updated.type
    const startTime = new Date(effectiveScheduledAt)
    const endTime = new Date(startTime.getTime() + effectiveDurationMins * 60 * 1000)

    updateCalendarEvent(effectiveInterviewer.email, googleEventId, {
      summary: `Interview: ${candidateName} — ${jobTitle}`,
      description: buildEventDescription({
        candidateName,
        jobTitle,
        interviewType: typeLabel,
        scorecardUrl: `${baseUrl}/interviewer/${eventId}`,
        notes: updated.notes ?? null,
      }),
      location: updated.location ?? null,
      startTime,
      endTime,
    }).catch(err => console.error('[events] Google Calendar update failed:', err))
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { applicationId: string; eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId, eventId } = params

  const existing = await prisma.interviewEvent.findUnique({
    where: { id: eventId },
    include: { interviewer: true },
  })
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

  // Delete Google Calendar event — fire-and-forget
  if (existing.googleCalendarEventId && existing.interviewer?.email) {
    deleteCalendarEvent(existing.interviewer.email, existing.googleCalendarEventId)
      .catch(err => console.error('[events] Google Calendar delete failed:', err))
  }

  return NextResponse.json({ ok: true })
}
