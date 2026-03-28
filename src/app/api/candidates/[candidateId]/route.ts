import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { candidateId: string } }
) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.candidateId },
      include: {
        applications: {
          include: { job: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error('[GET /api/candidates/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch candidate' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, linkedInUrl, source, notes } = body

    const candidate = await prisma.candidate.update({
      where: { id: params.candidateId },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(linkedInUrl !== undefined && { linkedInUrl: linkedInUrl?.trim() || null }),
        ...(source !== undefined && { source: source?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    })

    return NextResponse.json(candidate)
  } catch (error) {
    console.error('[PATCH /api/candidates/:id]', error)
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 })
  }
}
