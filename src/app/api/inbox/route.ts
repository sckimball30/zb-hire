import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGmailStatus, syncThreadReplies } from '@/lib/gmail'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any)?.id as string | undefined
  const userRole = (session.user as any)?.role as string | undefined
  const isRecruiter = userRole === 'RECRUITER'

  // Determine which candidates this user is allowed to see messages for.
  // Recruiters: candidates with applications in their assigned jobs.
  // Admins/others: all candidates (no restriction).
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

  // For Gmail sync: only sync threads this user personally sent (avoids unnecessary API calls)
  const myOutbound = userId
    ? await prisma.messageLog.findMany({
        where: {
          sentById: userId,
          direction: 'OUTBOUND',
          ...(scopedCandidateIds !== null ? { candidateId: { in: scopedCandidateIds } } : {}),
        },
        select: { candidateId: true },
        distinct: ['candidateId'],
      })
    : []
  const mySentCandidateIds = myOutbound.map(l => l.candidateId)

  // Sync Gmail replies for all conversations so unread counts are fresh
  try {
    const gmailStatus = await getGmailStatus()
    if (gmailStatus.connected && mySentCandidateIds.length > 0) {
      await Promise.all(mySentCandidateIds.map(id => syncThreadReplies(id).catch(() => null)))
    }
  } catch {
    // Non-fatal — continue with whatever is in the DB
  }

  // Build the where clause: for recruiters scope to assigned-job candidates;
  // for admins show all candidates that have any messages.
  const candidateFilter = scopedCandidateIds !== null
    ? (scopedCandidateIds.length > 0 ? { candidateId: { in: scopedCandidateIds } } : { id: 'none' })
    : {}

  // Fetch all messages for scoped candidates, excluding blocked ones
  const logs = await prisma.messageLog.findMany({
    where: { ...candidateFilter, candidate: { blocked: false } },
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
