import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: { offerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.offer.findUnique({
      where: { id: params.offerId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const offer = await prisma.offer.update({
      where: { id: params.offerId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        applicationId: existing.applicationId,
        action: `Offer sent to candidate`,
        actorName: session.user?.name || 'User',
      },
    })

    return NextResponse.json({ ok: true, offer })
  } catch (error) {
    console.error('[POST /api/offers/:id/send]', error)
    return NextResponse.json({ error: 'Failed to send offer' }, { status: 500 })
  }
}
