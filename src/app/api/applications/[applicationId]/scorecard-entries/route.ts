import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { applicationId: string } }) {
  const entries = await prisma.scorecardEntry.findMany({
    where: { applicationId: params.applicationId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest, { params }: { params: { applicationId: string } }) {
  const body = await req.json()
  const { sectionTitle, interviewerName, interviewerId, responses, status } = body

  if (!sectionTitle || !interviewerName) {
    return NextResponse.json({ error: 'sectionTitle and interviewerName are required' }, { status: 400 })
  }

  const entry = await prisma.scorecardEntry.create({
    data: {
      applicationId: params.applicationId,
      sectionTitle,
      interviewerName,
      interviewerId: interviewerId || null,
      responses: JSON.stringify(responses ?? {}),
      status: status ?? 'DRAFT',
      submittedAt: status === 'SUBMITTED' ? new Date() : null,
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
