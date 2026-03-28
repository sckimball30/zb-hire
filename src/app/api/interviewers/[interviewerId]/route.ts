import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { interviewerId: string } }
) {
  try {
    const interviewer = await prisma.interviewer.findUnique({
      where: { id: params.interviewerId },
      include: {
        jobAssignments: { include: { job: true } },
        scorecards: {
          include: { application: { include: { candidate: true, job: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { jobAssignments: true, scorecards: true } },
      },
    })

    if (!interviewer) {
      return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 })
    }

    return NextResponse.json(interviewer)
  } catch (error) {
    console.error('[GET /api/interviewers/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch interviewer' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { interviewerId: string } }
) {
  try {
    const body = await request.json()
    const { name, email, title, avatarUrl } = body

    const interviewer = await prisma.interviewer.update({
      where: { id: params.interviewerId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl?.trim() || null }),
      },
    })

    return NextResponse.json(interviewer)
  } catch (error) {
    console.error('[PATCH /api/interviewers/:id]', error)
    return NextResponse.json({ error: 'Failed to update interviewer' }, { status: 500 })
  }
}
