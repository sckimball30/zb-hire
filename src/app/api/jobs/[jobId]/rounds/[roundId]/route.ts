import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string; roundId: string } }
) {
  try {
    const body = await request.json()
    const { name, duration } = body

    const round = await prisma.interviewRound.update({
      where: { id: params.roundId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(duration !== undefined && { duration }),
      },
      include: {
        interviewers: {
          include: { interviewer: true },
        },
      },
    })

    return NextResponse.json(round)
  } catch (error) {
    console.error('[PATCH /api/jobs/:id/rounds/:roundId]', error)
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { jobId: string; roundId: string } }
) {
  try {
    await prisma.interviewRound.delete({
      where: { id: params.roundId },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/:id/rounds/:roundId]', error)
    return NextResponse.json({ error: 'Failed to delete round' }, { status: 500 })
  }
}
