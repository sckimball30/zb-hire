import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const interviewers = await prisma.interviewer.findMany({
      include: {
        _count: { select: { jobAssignments: true, scorecards: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(interviewers)
  } catch (error) {
    console.error('[GET /api/interviewers]', error)
    return NextResponse.json({ error: 'Failed to fetch interviewers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, title } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check for duplicate email
    const existing = await prisma.interviewer.findUnique({ where: { email: email.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'An interviewer with this email already exists' }, { status: 409 })
    }

    const interviewer = await prisma.interviewer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        title: title?.trim() || null,
      },
    })

    return NextResponse.json(interviewer, { status: 201 })
  } catch (error) {
    console.error('[POST /api/interviewers]', error)
    return NextResponse.json({ error: 'Failed to create interviewer' }, { status: 500 })
  }
}
