import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInterviewAssignmentEmail } from '@/lib/email'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { generateICS, icsAttachment } from '@/lib/ics'

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId } = params
  const body = await req.json()
  const { interviewerId, type, scheduledAt, durationMins, location, notes, calendlyEventUrl, scorecardSections } = body

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
      scorecardSections: scorecardSections ? JSON.stringify(scorecardSections) : null,
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

  // Send assignment notification email with calendar invite — fire-and-forget
  if (!isWorkingInterview && interviewer?.email) {
    const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`
    const jobTitle = application.job.title
    const typeLabel = INTERVIEW_TYPE_LABELS[type as keyof typeof INTERVIEW_TYPE_LABELS] ?? type
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
    const organizerEmail = process.env.SMTP_USER ?? process.env.EMAIL_FROM ?? 'hiring@wigglitz.com'
    const organizerName = 'ZB Hire'

    // Build ICS calendar invite if a time is set
    let calInvite: ReturnType<typeof icsAttachment> | undefined
    if (scheduledAt) {
      const startTime = new Date(scheduledAt)
      const endTime = new Date(startTime.getTime() + (durationMins ?? 60) * 60 * 1000)
      const ics = generateICS({
        uid: `interview-${event.id}@zbhire`,
        summary: `Interview: ${candidateName} — ${jobTitle}`,
        description: [
          `Candidate: ${candidateName}`,
          `Role: ${jobTitle}`,
          `Type: ${typeLabel}`,
          ``,
          `Scorecard: ${baseUrl}/interviewer/${event.id}`,
          notes ? `\nNotes: ${notes}` : '',
        ].join('\n').trim(),
        location: location ?? null,
        startTime,
        endTime,
        organizerEmail,
        organizerName,
        attendeeEmail: interviewer.email,
        attendeeName: interviewer.name,
        method: 'REQUEST',
        sequence: 0,
      })
      calInvite = icsAttachment(ics, 'REQUEST')
    }

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
      icsAttachment: calInvite,
    }).catch(err => console.error('[events] assignment email failed:', err))
  }

  return NextResponse.json(event, { status: 201 })
}
