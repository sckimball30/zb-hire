import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { token: params.token },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Only return if status is SENT
    if (offer.status !== 'SENT') {
      // Still return the offer but without full details for status display
      return NextResponse.json({
        id: offer.id,
        status: offer.status,
        jobTitle: offer.jobTitle,
        respondedAt: offer.respondedAt,
        expiresAt: offer.expiresAt,
      })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('[GET /api/offers/token/:token]', error)
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 })
  }
}
