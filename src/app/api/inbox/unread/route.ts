import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ count: 0 })

  const userId = (session.user as any)?.id as string | undefined
  const userRole = (session.user as any)?.role as string | undefined
  const isRecruiter = userRole === 'RECRUITER'

  // Determine candidate scope (mirrors /api/inbox logic)
  let scopedCandidateIds: string[] | null = null

  if (isRecruiter && userId) {
    const assignedJobs = await prisma.jobRecruiter.findMany({
      where: { userId },
      select: { jobId: true },
    })
    const jobIds = assignedJobs.map(j => j.jobId)
    if (jobIds.length > 0) {
      const apps = await prisma.application.findMany({
        where: { jobId: { in: jobIds } },
        select: { candidateId: true },
        distinct: ['candidateId'],
      })
      scopedCandidateIds = apps.map(a => a.candidateId)
    } else {
      scopedCandidateIds = []
    }
  }

  const candidateFilter = scopedCandidateIds !== null
    ? (scopedCandidateIds.length > 0 ? { candidateId: { in: scopedCandidateIds } } : null)
    : {}

  const count = candidateFilter !== null
    ? await prisma.messageLog.count({
        where: {
          direction: 'INBOUND',
          read: false,
          ...candidateFilter,
          candidate: { blocked: false },
        },
      })
    : 0

  return NextResponse.json({ count })
}
