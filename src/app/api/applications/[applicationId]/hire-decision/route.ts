import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { applicationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const decisions = await prisma.hireDecision.findMany({
    where: { applicationId: params.applicationId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(decisions)
}

export async function POST(req: NextRequest, { params }: { params: { applicationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const decision = await prisma.hireDecision.create({
    data: {
      applicationId: params.applicationId,
      interviewerName: body.interviewerName || (session.user as any)?.name || null,
      outcomesMatch: body.outcomesMatch || null,
      resultsOrientation: body.resultsOrientation || null,
      fierceOwnership: body.fierceOwnership || null,
      decisiveAction: body.decisiveAction || null,
      mentalToughness: body.mentalToughness || null,
      competitiveExcellence: body.competitiveExcellence || null,
      roleSpecificFit: body.roleSpecificFit || null,
      whoInterviewPattern: body.whoInterviewPattern || null,
      referenceCheck: body.referenceCheck || null,
      gutCheckThrilled: body.gutCheckThrilled || null,
      gutCheckTeam: body.gutCheckTeam || null,
      gutCheckEmbarrassed: body.gutCheckEmbarrassed || null,
      overallRating: body.overallRating || null,
      rationale: body.rationale || null,
      recommendation: body.recommendation || null,
      submittedAt: body.recommendation ? new Date() : null,
    }
  })
  return NextResponse.json(decision)
}
