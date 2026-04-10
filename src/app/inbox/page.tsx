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

  // Find candidates this user has messaged
  const myOutbound = userId
    ? await prisma.messageLog.findMany({
        where: { sentById: userId, direction: 'OUTBOUND' },
        select: { candidateId: true },
        distinct: ['candidateId'],
      })
    : []
  const myCandidateIds = myOutbound.map(l => l.candidateId)

  // Fetch all messages (inbound + outbound) for those candidates
  const logs = await prisma.messageLog.findMany({
    where: myCandidateIds.length > 0 ? { candidateId: { in: myCandidateIds } } : { id: 'none' },
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
