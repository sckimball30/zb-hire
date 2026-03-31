import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await prisma.jobResponsibility.findMany({ where: { jobId: params.jobId }, orderBy: { number: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { responsibilities } = await req.json()
  await prisma.jobResponsibility.deleteMany({ where: { jobId: params.jobId } })
  const created = await prisma.jobResponsibility.createMany({
    data: responsibilities.filter((r: any) => r.description?.trim()).map((r: any, i: number) => ({
      jobId: params.jobId, number: i + 1, description: r.description.trim(), ownsWith: r.ownsWith?.trim() || null
    }))
  })
  return NextResponse.json({ ok: true, count: created.count })
}
