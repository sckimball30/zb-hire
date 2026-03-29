import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { jobId: string } }

function requireRecruiterOrAdmin(role: string) {
  return role === 'ADMIN' || role === 'RECRUITER'
}

// GET — list recruiters for a job
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recruiters = await prisma.jobRecruiter.findMany({
    where: { jobId: params.jobId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(recruiters)
}

// POST — assign a recruiter
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as any).role ?? ''
  if (!requireRecruiterOrAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, isMain } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // If setting as main, demote any existing main recruiter
  if (isMain) {
    await prisma.jobRecruiter.updateMany({
      where: { jobId: params.jobId, isMain: true },
      data: { isMain: false },
    })
  }

  const assignment = await prisma.jobRecruiter.upsert({
    where: { jobId_userId: { jobId: params.jobId, userId } },
    create: { jobId: params.jobId, userId, isMain: isMain ?? false, emailNotifications: true },
    update: { isMain: isMain ?? false },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(assignment)
}

// PATCH — update isMain or emailNotifications
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as any).role ?? ''
  if (!requireRecruiterOrAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, isMain, emailNotifications } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // If promoting to main, demote existing main
  if (isMain === true) {
    await prisma.jobRecruiter.updateMany({
      where: { jobId: params.jobId, isMain: true },
      data: { isMain: false },
    })
  }

  const updated = await prisma.jobRecruiter.update({
    where: { jobId_userId: { jobId: params.jobId, userId } },
    data: {
      ...(isMain !== undefined ? { isMain } : {}),
      ...(emailNotifications !== undefined ? { emailNotifications } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(updated)
}

// DELETE — remove a recruiter from a job
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as any).role ?? ''
  if (!requireRecruiterOrAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  await prisma.jobRecruiter.delete({
    where: { jobId_userId: { jobId: params.jobId, userId } },
  })

  return NextResponse.json({ ok: true })
}
