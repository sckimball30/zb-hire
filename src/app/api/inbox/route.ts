import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all candidates who have at least one message log, with latest message + unread count
  const logs = await prisma.messageLog.findMany({
    orderBy: { sentAt: 'desc' },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  // Group by candidateId — keep first (latest) message per candidate
  const seen = new Set<string>()
  const conversations: any[] = []

  for (const log of logs) {
    if (!seen.has(log.candidateId)) {
      seen.add(log.candidateId)
      // Count unread for this candidate
      const unreadCount = logs.filter(
        l => l.candidateId === log.candidateId && l.direction === 'INBOUND' && !l.read
      ).length
      conversations.push({
        candidateId: log.candidateId,
        candidate: log.candidate,
        lastMessage: {
          subject: log.subject,
          body: log.body,
          sentAt: log.sentAt,
          direction: log.direction,
          sentByName: log.sentByName,
        },
        unreadCount,
      })
    }
  }

  return NextResponse.json(conversations)
}
