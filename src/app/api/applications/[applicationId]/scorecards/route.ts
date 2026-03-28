import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const scorecards = await prisma.scorecard.findMany({
      where: { applicationId: params.applicationId },
      include: {
        interviewer: true,
        responses: { include: { question: true } },
        interviewEvent: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(scorecards)
  } catch (error) {
    console.error('[GET /api/applications/:id/scorecards]', error)
    return NextResponse.json({ error: 'Failed to fetch scorecards' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const body = await request.json()
    const { interviewerId, interviewEventId } = body

    if (!interviewerId) {
      return NextResponse.json({ error: 'interviewerId is required' }, { status: 400 })
    }

    const scorecard = await prisma.scorecard.create({
      data: {
        applicationId: params.applicationId,
        interviewerId,
        interviewEventId: interviewEventId || null,
      },
      include: { interviewer: true },
    })

    return NextResponse.json(scorecard, { status: 201 })
  } catch (error) {
    console.error('[POST /api/applications/:id/scorecards]', error)
    return NextResponse.json({ error: 'Failed to create scorecard' }, { status: 500 })
  }
}
