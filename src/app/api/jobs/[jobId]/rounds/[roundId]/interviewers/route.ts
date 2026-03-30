import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { jobId: string; roundId: string } }
) {
  try {
    const body = await request.json()
    const { interviewerId } = body

    if (!interviewerId) {
      return NextResponse.json({ error: 'interviewerId is required' }, { status: 400 })
    }

    const existing = await prisma.roundInterviewer.findUnique({
      where: { roundId_interviewerId: { roundId: params.roundId, interviewerId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Interviewer already assigned to this round' }, { status: 409 })
    }

    const assignment = await prisma.roundInterviewer.create({
      data: {
        roundId: params.roundId,
        interviewerId,
      },
      include: { interviewer: true },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('[POST /api/jobs/:id/rounds/:roundId/interviewers]', error)
    return NextResponse.json({ error: 'Failed to assign interviewer' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { jobId: string; roundId: string } }
) {
  try {
    const body = await request.json()
    const { interviewerId } = body

    if (!interviewerId) {
      return NextResponse.json({ error: 'interviewerId is required' }, { status: 400 })
    }

    await prisma.roundInterviewer.delete({
      where: { roundId_interviewerId: { roundId: params.roundId, interviewerId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/:id/rounds/:roundId/interviewers]', error)
    return NextResponse.json({ error: 'Failed to remove interviewer from round' }, { status: 500 })
  }
}
