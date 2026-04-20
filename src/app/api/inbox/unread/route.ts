import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ count: 0 })

  const userId = (session.user as any)?.id as string | undefined

  // Get candidateIds this user has messaged
  const myOutbound = userId
    ? await prisma.messageLog.findMany({
        where: { sentById: userId, direction: 'OUTBOUND' },
        select: { candidateId: true },
        distinct: ['candidateId'],
      })
    : []
  const myCandidateIds = myOutbound.map(l => l.candidateId)

  const count = myCandidateIds.length > 0
    ? await prisma.messageLog.count({
        where: {
          direction: 'INBOUND',
          read: false,
          candidateId: { in: myCandidateIds },
          candidate: { blocked: false },
        },
      })
    : 0

  return NextResponse.json({ count })
}
