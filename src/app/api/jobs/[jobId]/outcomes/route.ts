import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const outcomes = await prisma.jobOutcome.findMany({ where: { jobId: params.jobId }, orderBy: { priority: 'asc' } })
  return NextResponse.json(outcomes)
}

export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { outcomes } = await req.json()
  await prisma.jobOutcome.deleteMany({ where: { jobId: params.jobId } })
  const created = await prisma.jobOutcome.createMany({
    data: outcomes.filter((o: any) => o.outcome?.trim()).map((o: any, i: number) => ({
      jobId: params.jobId, priority: i + 1, outcome: o.outcome.trim(), kpi: o.kpi?.trim() || null
    }))
  })
  return NextResponse.json({ ok: true, count: created.count })
}
