import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { applicationId: string; entryId: string } }) {
  const body = await req.json()
  const { responses, status, interviewerName } = body

  const entry = await prisma.scorecardEntry.update({
    where: { id: params.entryId },
    data: {
      ...(responses !== undefined && { responses: JSON.stringify(responses) }),
      ...(status !== undefined && { status }),
      ...(interviewerName !== undefined && { interviewerName }),
      ...(status === 'SUBMITTED' && { submittedAt: new Date() }),
    },
  })

  return NextResponse.json(entry)
}

export async function DELETE(_req: NextRequest, { params }: { params: { applicationId: string; entryId: string } }) {
  await prisma.scorecardEntry.delete({ where: { id: params.entryId } })
  return NextResponse.json({ ok: true })
}
