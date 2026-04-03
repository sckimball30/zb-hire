import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(
  _req: Request,
  { params }: { params: { offerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const offer = await prisma.offer.findUnique({ where: { id: params.offerId } })
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  if (offer.status === 'ACCEPTED') {
    return NextResponse.json(
      { error: 'Cannot reissue an accepted offer' },
      { status: 400 }
    )
  }

  // Reset to DRAFT with a fresh token so the old link stops working
  const updated = await prisma.offer.update({
    where: { id: params.offerId },
    data: {
      status: 'DRAFT',
      token: randomUUID(),
      sentAt: null,
      respondedAt: null,
      // Clear expiry so recruiter can set a new one when editing
      expiresAt: null,
    },
  })

  return NextResponse.json(updated)
}
