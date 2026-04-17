import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

// GET: return all open jobs + which ones this user is assigned to as HM
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const [jobs, user] = await Promise.all([
    prisma.job.findMany({
      where: { status: 'OPEN' },
      select: { id: true, title: true, department: true, hiringManagerId: true },
      orderBy: { title: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true },
    }),
  ])

  return NextResponse.json({ jobs, userId: params.userId })
}

// PUT: set hiringManagerId on a job to this user (or null to unassign)
export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const { jobId, assign } = await req.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  await prisma.job.update({
    where: { id: jobId },
    data: { hiringManagerId: assign ? params.userId : null },
  })

  return NextResponse.json({ ok: true })
}
