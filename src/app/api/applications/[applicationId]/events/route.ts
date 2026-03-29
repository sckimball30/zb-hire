import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId } = params
  const body = await req.json()
  const { interviewerId, type, scheduledAt, durationMins, location, notes, calendlyEventUrl } = body

  if (!interviewerId || !type) {
    return NextResponse.json({ error: 'interviewerId and type are required' }, { status: 400 })
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const interviewer = await prisma.interviewer.findUnique({ where: { id: interviewerId } })
  if (!interviewer) return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 })

  const event = await prisma.interviewEvent.create({
    data: {
      applicationId,
      interviewerId,
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
      action: `Interview scheduled: ${type.replace('_', ' ')} with ${interviewer.name}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  return NextResponse.json(event, { status: 201 })
}
