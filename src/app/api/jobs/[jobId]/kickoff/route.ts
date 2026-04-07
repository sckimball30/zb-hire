import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const kickoff = await prisma.jobKickoff.findUnique({ where: { jobId: params.jobId } })
  return NextResponse.json(kickoff ?? {})
}

export async function PUT(req: Request, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Sanitize: pick only known fields
  const {
    openReason, backfillFor, urgency, targetStartDate, hardDeadlineNotes,
    mustHaves, niceToHaves, redFlags, idealCandidate,
    teamSize, teamContext, successAt90Days,
    equityOffered, equityDetails, bonusOffered, bonusDetails, additionalPerks,
    interviewProcessNotes, hiringManagerNotes, completedAt,
  } = body

  const data = {
    openReason: openReason ?? null,
    backfillFor: backfillFor ?? null,
    urgency: urgency ?? null,
    targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
    hardDeadlineNotes: hardDeadlineNotes ?? null,
    mustHaves: mustHaves ?? null,
    niceToHaves: niceToHaves ?? null,
    redFlags: redFlags ?? null,
    idealCandidate: idealCandidate ?? null,
    teamSize: teamSize ?? null,
    teamContext: teamContext ?? null,
    successAt90Days: successAt90Days ?? null,
    equityOffered: equityOffered ?? false,
    equityDetails: equityDetails ?? null,
    bonusOffered: bonusOffered ?? false,
    bonusDetails: bonusDetails ?? null,
    additionalPerks: additionalPerks ?? null,
    interviewProcessNotes: interviewProcessNotes ?? null,
    hiringManagerNotes: hiringManagerNotes ?? null,
    completedAt: completedAt ? new Date(completedAt) : null,
  }

  const kickoff = await prisma.jobKickoff.upsert({
    where: { jobId: params.jobId },
    create: { jobId: params.jobId, ...data },
    update: data,
  })

  return NextResponse.json(kickoff)
}
