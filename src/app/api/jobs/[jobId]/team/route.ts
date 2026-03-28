import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const team = await prisma.jobInterviewer.findMany({
      where: { jobId: params.jobId },
      include: { interviewer: true },
      orderBy: { assignedAt: 'asc' },
    })
    return NextResponse.json(team)
  } catch (error) {
    console.error('[GET /api/jobs/:id/team]', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json()
    const { interviewerId, role } = body

    if (!interviewerId) {
      return NextResponse.json({ error: 'interviewerId is required' }, { status: 400 })
    }

    // Check if already assigned
    const existing = await prisma.jobInterviewer.findUnique({
      where: { jobId_interviewerId: { jobId: params.jobId, interviewerId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Interviewer already on team' }, { status: 409 })
    }

    const member = await prisma.jobInterviewer.create({
      data: {
        jobId: params.jobId,
        interviewerId,
        role: role?.trim() || null,
      },
      include: { interviewer: true },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('[POST /api/jobs/:id/team]', error)
    return NextResponse.json({ error: 'Failed to add interviewer' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json()
    const { interviewerId } = body

    if (!interviewerId) {
      return NextResponse.json({ error: 'interviewerId is required' }, { status: 400 })
    }

    await prisma.jobInterviewer.delete({
      where: { jobId_interviewerId: { jobId: params.jobId, interviewerId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/:id/team]', error)
    return NextResponse.json({ error: 'Failed to remove interviewer' }, { status: 500 })
  }
}
