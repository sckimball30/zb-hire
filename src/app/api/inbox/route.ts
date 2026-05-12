import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGmailStatus, syncThreadReplies } from '@/lib/gmail'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Sync Gmail replies for all conversations so unread counts are fresh
  try {
    const gmailStatus = await getGmailStatus()
    if (gmailStatus.connected && myCandidateIds.length > 0) {
      await Promise.all(myCandidateIds.map(id => syncThreadReplies(id).catch(() => null)))
    }
  } catch {
    // Non-fatal — continue with whatever is in the DB
  }

  // Fetch all messages (inbound + outbound) for those candidates, excluding blocked ones
  const logs = await prisma.messageLog.findMany({
    where: myCandidateIds.length > 0
      ? { candidateId: { in: myCandidateIds }, candidate: { blocked: false } }
      : { id: 'none' },
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
