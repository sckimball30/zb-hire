import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    const candidates = await prisma.candidate.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('[GET /api/candidates]', error)
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, linkedInUrl, source, notes } = body

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'firstName, lastName, and email are required' }, { status: 400 })
    }

    // Check for duplicate email
    const existing = await prisma.candidate.findUnique({ where: { email: email.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'A candidate with this email already exists' }, { status: 409 })
    }

    const candidate = await prisma.candidate.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        linkedInUrl: linkedInUrl?.trim() || null,
        source: source?.trim() || null,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    console.error('[POST /api/candidates]', error)
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
  }
}
