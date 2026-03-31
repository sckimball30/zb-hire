import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { reportsTo, mission } = await req.json()
  const job = await prisma.job.update({
    where: { id: params.jobId },
    data: { reportsTo: reportsTo ?? undefined, mission: mission ?? undefined },
  })
  return NextResponse.json(job)
}
