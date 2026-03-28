import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STAGE_ORDER, STAGE_LABELS } from '@/lib/constants'
import type { CandidateStage } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.applicationId },
      include: {
        candidate: true,
        job: true,
        events: {
          include: { interviewer: true, scorecard: true },
          orderBy: { scheduledAt: 'desc' },
        },
        scorecards: {
          include: {
            interviewer: true,
            responses: { include: { question: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activityLog: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('[GET /api/applications/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const body = await request.json()
    const { stage, notes, stageOrder, starRating } = body

    const current = await prisma.application.findUnique({
      where: { id: params.applicationId },
      select: { stage: true },
    })

    if (!current) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (stage !== undefined && stage !== current.stage) {
      updateData.stage = stage as CandidateStage
      updateData.stageOrder = stageOrder !== undefined ? stageOrder : STAGE_ORDER[stage as string]

      // Handle special stages
      if (stage === 'REJECTED') {
        updateData.rejectedAt = new Date()
      } else if (stage === 'HIRED') {
        updateData.hiredAt = new Date()
      }
    }

    if (starRating !== undefined) {
      updateData.starRating = starRating === null ? null : Math.min(5, Math.max(1, Number(starRating)))
    }

    const application = await prisma.application.update({
      where: { id: params.applicationId },
      data: updateData,
    })

    // Write activity log if stage changed
    if (stage !== undefined && stage !== current.stage) {
      await prisma.activityLog.create({
        data: {
          applicationId: params.applicationId,
          action: `Stage changed to ${STAGE_LABELS[stage as CandidateStage]}`,
          actorName: body.actorName || 'User',
        },
      })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('[PATCH /api/applications/:id]', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}
