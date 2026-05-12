export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { InboxClient } from '@/components/inbox/InboxClient'

export default async function InboxPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const userId = (session.user as any)?.id as string | undefined
  const userRole = (session.user as any)?.role as string | undefined
  const isRecruiter = userRole === 'RECRUITER'

  // Determine candidate scope: recruiters see candidates in their assigned jobs,
  // admins/others see all candidates with messages.
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
    ? (scopedCandidateIds.length > 0 ? { candidateId: { in: scopedCandidateIds } } : { id: 'none' })
    : {}

  // Fetch all messages for scoped candidates
  const logs = await prisma.messageLog.findMany({
    where: { ...candidateFilter },
    orderBy: { sentAt: 'desc' },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  // Group by candidate — one entry per candidate with latest message + unread count
  const seen = new Set<string>()
  const conversations: any[] = []

  for (const log of logs) {
    if (!seen.has(log.candidateId)) {
      seen.add(log.candidateId)
      const unreadCount = logs.filter(
        l => l.candidateId === log.candidateId && l.direction === 'INBOUND' && !l.read
      ).length
      conversations.push({
        candidateId: log.candidateId,
        candidate: log.candidate,
        lastMessage: {
          subject: log.subject,
          body: log.body,
          sentAt: log.sentAt.toISOString(),
          direction: log.direction,
          sentByName: log.sentByName,
        },
        unreadCount,
      })
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <InboxClient initialConversations={conversations} />
    </div>
  )
}
