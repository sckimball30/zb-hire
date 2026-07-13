import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    const fields = ['i9', 'bankInfo', 'employeeHandbook', 'i9Verification', 'notes', 'location'] as const
    for (const f of fields) {
      if (f in body) data[f] = f === 'notes' ? (body[f] || null) : body[f]
    }
    if ('startDate' in body) {
      data.startDate = body.startDate ? new Date(body.startDate) : null
    }
    const record = await prisma.onboardingRecord.update({ where: { id: params.id }, data })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[PATCH /api/onboarding/:id]', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.onboardingRecord.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/onboarding/:id]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
