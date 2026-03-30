import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'action must be ACCEPT or DECLINE' }, { status: 400 })
    }

    const existing = await prisma.offer.findUnique({
      where: { token: params.token },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (existing.status !== 'SENT') {
      return NextResponse.json({ error: 'Offer is not in a state that can be responded to' }, { status: 400 })
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'

    const offer = await prisma.offer.update({
      where: { token: params.token },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
    })

    // Log activity on the application
    await prisma.activityLog.create({
      data: {
        applicationId: existing.applicationId,
        action: action === 'ACCEPT'
          ? `Candidate accepted the offer for ${existing.jobTitle}`
          : `Candidate declined the offer for ${existing.jobTitle}`,
        actorName: 'Candidate',
      },
    })

    return NextResponse.json({ ok: true, offer })
  } catch (error) {
    console.error('[POST /api/offers/token/:token/respond]', error)
    return NextResponse.json({ error: 'Failed to respond to offer' }, { status: 500 })
  }
}
