import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { applicationId, jobTitle, salary, salaryType, currency, startDate, expiresAt, notes, employmentType, bonus } = body

    if (!applicationId || !jobTitle) {
      return NextResponse.json({ error: 'applicationId and jobTitle are required' }, { status: 400 })
    }

    // Check application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if offer already exists for this application
    const existing = await prisma.offer.findUnique({
      where: { applicationId },
    })

    if (existing) {
      return NextResponse.json({ error: 'An offer already exists for this application' }, { status: 409 })
    }

    const offer = await prisma.offer.create({
      data: {
        applicationId,
        jobTitle,
        salary: salary ? Number(salary) : null,
        salaryType: salaryType || 'ANNUAL',
        currency: currency || 'USD',
        startDate: startDate ? new Date(startDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        employmentType: employmentType || null,
        bonus: bonus || null,
        status: 'DRAFT',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        applicationId,
        action: `Offer created for ${jobTitle}`,
        actorName: session.user?.name || 'User',
      },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('[POST /api/offers]', error)
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
  }
}
