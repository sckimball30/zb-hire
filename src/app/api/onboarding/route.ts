export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const records = await prisma.onboardingRecord.findMany({
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(records)
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, role, location, startDate, notes } = await request.json()
    const record = await prisma.onboardingRecord.create({
      data: {
        firstName,
        lastName,
        role,
        location,
        startDate: startDate ? new Date(startDate) : null,
        notes: notes || null,
        source: 'MANUAL',
      },
    })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[POST /api/onboarding]', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
