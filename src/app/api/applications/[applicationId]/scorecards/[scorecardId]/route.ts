import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Rating } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: { applicationId: string; scorecardId: string } }
) {
  try {
    const scorecard = await prisma.scorecard.findFirst({
      where: {
        id: params.scorecardId,
        applicationId: params.applicationId,
      },
      include: {
        interviewer: true,
        responses: { include: { question: true } },
        interviewEvent: true,
      },
    })

    if (!scorecard) {
      return NextResponse.json({ error: 'Scorecard not found' }, { status: 404 })
    }

    return NextResponse.json(scorecard)
  } catch (error) {
    console.error('[GET /api/applications/:id/scorecards/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { applicationId: string; scorecardId: string } }
) {
  try {
    const body = await request.json()
    const { overallRating, summary, recommendation, submittedAt, responses } = body

    // Update responses if provided
    if (responses && Array.isArray(responses)) {
      for (const response of responses) {
        await prisma.scorecardResponse.upsert({
          where: {
            scorecardId_questionId: {
              scorecardId: params.scorecardId,
              questionId: response.questionId,
            },
          },
          update: {
            rating: response.rating as Rating | null,
            notes: response.notes || null,
          },
          create: {
            scorecardId: params.scorecardId,
            questionId: response.questionId,
            rating: response.rating as Rating | null,
            notes: response.notes || null,
          },
        })
      }
    }

    const scorecard = await prisma.scorecard.update({
      where: { id: params.scorecardId },
      data: {
        ...(overallRating !== undefined && { overallRating: overallRating as Rating | null }),
        ...(summary !== undefined && { summary: summary || null }),
        ...(recommendation !== undefined && { recommendation: recommendation || null }),
        ...(submittedAt !== undefined && { submittedAt: submittedAt ? new Date(submittedAt) : null }),
      },
      include: {
        interviewer: true,
        responses: { include: { question: true } },
      },
    })

    return NextResponse.json(scorecard)
  } catch (error) {
    console.error('[PATCH /api/applications/:id/scorecards/:id]', error)
    return NextResponse.json({ error: 'Failed to update scorecard' }, { status: 500 })
  }
}
