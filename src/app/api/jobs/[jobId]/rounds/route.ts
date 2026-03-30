import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const rounds = await prisma.interviewRound.findMany({
      where: { jobId: params.jobId },
      include: {
        interviewers: {
          include: { interviewer: true },
        },
      },
      orderBy: { roundNumber: 'asc' },
    })
    return NextResponse.json(rounds)
  } catch (error) {
    console.error('[GET /api/jobs/:id/rounds]', error)
    return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json()
    const { name, roundNumber, duration } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const round = await prisma.interviewRound.create({
      data: {
        jobId: params.jobId,
        name: name.trim(),
        roundNumber: roundNumber ?? 1,
        duration: duration ?? 60,
      },
      include: {
        interviewers: {
          include: { interviewer: true },
        },
      },
    })

    return NextResponse.json(round, { status: 201 })
  } catch (error) {
    console.error('[POST /api/jobs/:id/rounds]', error)
    return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
  }
}
