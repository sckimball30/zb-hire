import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncThreadReplies } from '@/lib/gmail'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId } = await req.json()
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  try {
    const newCount = await syncThreadReplies(candidateId)

    // Return updated message logs
    const messages = await prisma.messageLog.findMany({
      where: { candidateId },
      orderBy: { sentAt: 'asc' },
    })

    return NextResponse.json({ ok: true, newCount, messages })
  } catch (err: any) {
    console.error('[sync]', err)
    return NextResponse.json({ error: err.message ?? 'Sync failed' }, { status: 500 })
  }
}
