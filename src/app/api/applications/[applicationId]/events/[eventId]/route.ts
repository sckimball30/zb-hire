import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { sendInterviewUpdateEmail, sendInterviewCancellationEmail } from '@/lib/email'
import { generateICS, icsAttachment } from '@/lib/ics'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { applicationId: string; eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId, eventId } = params
  const body = await req.json()
  const { interviewerId, type, scheduledAt, durationMins, location, notes, scorecardSections } = body

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
      scorecardSections: scorecardSections !== undefined
        ? (scorecardSections ? JSON.stringify(scorecardSections) : null)
        : existing.scorecardSections,
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

  // Send update email with refreshed calendar invite — fire-and-forget
  if (!isWorkingInterview && updated.interviewer?.email) {
    const candidateName = `${updated.application.candidate.firstName} ${updated.application.candidate.lastName}`
    const jobTitle = updated.application.job.title
    const typeLabel = INTERVIEW_TYPE_LABELS[updated.type as keyof typeof INTERVIEW_TYPE_LABELS] ?? updated.type
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
    const organizerEmail = process.env.SMTP_USER ?? 'hiring@wigglitz.com'
    const organizerName = 'ZB Hire'

    const effectiveScheduledAt = scheduledAt !== undefined ? scheduledAt : existing.scheduledAt?.toISOString() ?? null
    const effectiveDurationMins = durationMins ?? existing.durationMins

    let calInvite: ReturnType<typeof icsAttachment> | undefined
    if (effectiveScheduledAt) {
      const startTime = new Date(effectiveScheduledAt)
      const endTime = new Date(startTime.getTime() + effectiveDurationMins * 60 * 1000)
      const ics = generateICS({
        uid: `interview-${eventId}@zbhire`,
        summary: `Interview: ${candidateName} — ${jobTitle}`,
        description: [
          `Candidate: ${candidateName}`,
          `Role: ${jobTitle}`,
          `Type: ${typeLabel}`,
          ``,
          `Scorecard: ${baseUrl}/interviewer/${eventId}`,
          updated.notes ? `\nNotes: ${updated.notes}` : '',
        ].join('\n').trim(),
        location: updated.location ?? null,
        startTime,
        endTime,
        organizerEmail,
        organizerName,
        attendeeEmail: updated.interviewer.email,
        attendeeName: updated.interviewer.name,
        method: 'REQUEST',
        sequence: 1,
      })
      calInvite = icsAttachment(ics, 'REQUEST')
    }

    sendInterviewUpdateEmail({
      to: updated.interviewer.email,
      interviewerName: updated.interviewer.name,
      candidateName,
      jobTitle,
      interviewType: typeLabel,
      scheduledAt: effectiveScheduledAt,
      location: updated.location ?? null,
      notes: updated.notes ?? null,
      eventId,
      icsAttachment: calInvite,
    }).catch(err => console.error('[events] update email failed:', err))
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

  // Send cancellation email with CANCEL ICS — fire-and-forget
  if (existing.interviewer?.email) {
    const candidateName = `${existing.application.candidate.firstName} ${existing.application.candidate.lastName}`
    const jobTitle = existing.application.job.title
    const organizerEmail = process.env.SMTP_USER ?? 'hiring@wigglitz.com'
    const organizerName = 'ZB Hire'

    let calInvite: ReturnType<typeof icsAttachment> | undefined
    if (existing.scheduledAt) {
      const startTime = new Date(existing.scheduledAt)
      const endTime = new Date(startTime.getTime() + existing.durationMins * 60 * 1000)
      const ics = generateICS({
        uid: `interview-${eventId}@zbhire`,
        summary: `Interview: ${candidateName} — ${jobTitle}`,
        location: existing.location ?? null,
        startTime,
        endTime,
        organizerEmail,
        organizerName,
        attendeeEmail: existing.interviewer.email,
        attendeeName: existing.interviewer.name,
        method: 'CANCEL',
        sequence: 99,
      })
      calInvite = icsAttachment(ics, 'CANCEL')
    }

    sendInterviewCancellationEmail({
      to: existing.interviewer.email,
      interviewerName: existing.interviewer.name,
      candidateName,
      jobTitle,
      scheduledAt: existing.scheduledAt?.toISOString() ?? null,
      icsAttachment: calInvite,
    }).catch(err => console.error('[events] cancellation email failed:', err))
  }

  return NextResponse.json({ ok: true })
}
