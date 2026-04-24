import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInterviewAssignmentEmail } from '@/lib/email'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { createCalendarEvent, buildEventDescription } from '@/lib/google-calendar'

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId } = params
  const body = await req.json()
  const { interviewerId, type, scheduledAt, durationMins, location, notes, calendlyEventUrl } = body

  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 })
  }

  const isWorkingInterview = type === 'WORKING_INTERVIEW'

  if (!isWorkingInterview && !interviewerId) {
    return NextResponse.json({ error: 'interviewerId is required for this interview type' }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: { select: { firstName: true, lastName: true } },
      job: { select: { title: true } },
    },
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  let interviewer = null
  if (!isWorkingInterview && interviewerId) {
    interviewer = await prisma.interviewer.findUnique({ where: { id: interviewerId } })
    if (!interviewer) return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 })
  }

  const event = await prisma.interviewEvent.create({
    data: {
      applicationId,
      interviewerId: isWorkingInterview ? null : interviewerId,
      type,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      durationMins: durationMins ?? 60,
      location: location ?? null,
      notes: notes ?? null,
      calendlyEventUrl: calendlyEventUrl ?? null,
    },
    include: { interviewer: true },
  })

  await prisma.activityLog.create({
    data: {
      applicationId,
      action: isWorkingInterview
        ? 'Working Interview logged'
        : `Interview scheduled: ${type.replace('_', ' ')} with ${interviewer?.name}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`
  const jobTitle = application.job.title
  const typeLabel = INTERVIEW_TYPE_LABELS[type as keyof typeof INTERVIEW_TYPE_LABELS] ?? type
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'

  // Google Calendar event — fire-and-forget, only when time is set
  if (!isWorkingInterview && interviewer?.email && scheduledAt) {
    const startTime = new Date(scheduledAt)
    const endTime = new Date(startTime.getTime() + (durationMins ?? 60) * 60 * 1000)

    createCalendarEvent({
      interviewerEmail: interviewer.email,
      summary: `Interview: ${candidateName} — ${jobTitle}`,
      description: buildEventDescription({
        candidateName,
        jobTitle,
        interviewType: typeLabel,
        scorecardUrl: `${baseUrl}/interviewer/${event.id}`,
        notes: notes ?? null,
      }),
      location: location ?? null,
      startTime,
      endTime,
    })
      .then(async (googleCalendarEventId) => {
        if (googleCalendarEventId) {
          await prisma.interviewEvent.update({
            where: { id: event.id },
            data: { googleCalendarEventId },
          })
        }
      })
      .catch(err => console.error('[events] Google Calendar create failed:', err))
  }

  // Send assignment notification email — fire-and-forget
  if (!isWorkingInterview && interviewer?.email) {
    sendInterviewAssignmentEmail({
      to: interviewer.email,
      interviewerName: interviewer.name,
      candidateName,
      jobTitle,
      interviewType: typeLabel,
      scheduledAt: scheduledAt ?? null,
      location: location ?? null,
      notes: notes ?? null,
      eventId: event.id,
    }).catch(err => console.error('[events] assignment email failed:', err))
  }

  return NextResponse.json(event, { status: 201 })
}
