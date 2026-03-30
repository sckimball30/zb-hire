import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { offerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: params.offerId },
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

    return NextResponse.json(offer)
  } catch (error) {
    console.error('[GET /api/offers/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { offerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { jobTitle, salary, salaryType, currency, startDate, expiresAt, notes, status } = body

    const existing = await prisma.offer.findUnique({
      where: { id: params.offerId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle
    if (salary !== undefined) updateData.salary = salary === null ? null : Number(salary)
    if (salaryType !== undefined) updateData.salaryType = salaryType
    if (currency !== undefined) updateData.currency = currency
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    const offer = await prisma.offer.update({
      where: { id: params.offerId },
      data: updateData,
    })

    return NextResponse.json(offer)
  } catch (error) {
    console.error('[PATCH /api/offers/:id]', error)
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
  }
}

export async function DELETE(
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

    await prisma.offer.delete({
      where: { id: params.offerId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        applicationId: existing.applicationId,
        action: `Offer deleted`,
        actorName: session.user?.name || 'User',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/offers/:id]', error)
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
  }
}
