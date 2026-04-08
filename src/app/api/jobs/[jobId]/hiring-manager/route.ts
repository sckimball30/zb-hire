import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await req.json()

  const job = await prisma.job.update({
    where: { id: params.jobId },
    data: { hiringManagerId: userId ?? null },
    include: { hiringManager: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(job)
}
