import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncThreadReplies } from '@/lib/gmail'
import { getGmailStatus, sendViaGmail } from '@/lib/gmail'
import { sendEmail } from '@/lib/email'

// GET thread + mark as read + sync Gmail replies
export async function GET(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId } = params

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Sync Gmail replies (non-blocking — we still return existing messages if it fails)
  try {
    const gmailStatus = await getGmailStatus()
    if (gmailStatus.connected) {
      await syncThreadReplies(candidateId)
    }
  } catch (err) {
    console.error('[inbox] gmail sync failed (non-fatal):', err)
  }

  // Mark inbound messages as read
  await prisma.messageLog.updateMany({
    where: { candidateId, direction: 'INBOUND', read: false },
    data: { read: true },
  })

  const userId = (session.user as any)?.id as string | undefined

  // Get gmailThreadIds started by this user for this candidate
  const myThreadIds = userId
    ? await prisma.messageLog.findMany({
        where: { candidateId, sentById: userId, direction: 'OUTBOUND', gmailThreadId: { not: null } },
        select: { gmailThreadId: true },
        distinct: ['gmailThreadId'],
      }).then(rows => rows.map(r => r.gmailThreadId as string))
    : []

  // Show: outbound messages from this user + inbound replies in their threads (or all inbound if no gmail)
  const messages = await prisma.messageLog.findMany({
    where: {
      candidateId,
      OR: [
        // Their own sent messages
        ...(userId ? [{ sentById: userId, direction: 'OUTBOUND' }] : []),
        // Inbound replies — scoped to their threads when gmail is used
        myThreadIds.length > 0
          ? { direction: 'INBOUND', gmailThreadId: { in: myThreadIds } }
          : { direction: 'INBOUND' },
      ],
    },
    orderBy: { sentAt: 'asc' },
  })

  return NextResponse.json({ candidate, messages })
}

// POST reply
export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId } = params
  const { body } = await req.json()

  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Find most recent thread to reply to
  const lastThreaded = await prisma.messageLog.findFirst({
    where: { candidateId, gmailThreadId: { not: null } },
    orderBy: { sentAt: 'desc' },
    select: { gmailThreadId: true, gmailMessageId: true, subject: true },
  })

  let gmailThreadId: string | null = null
  let gmailMessageId: string | null = null
  const subject = lastThreaded?.subject ?? `Re: Your Application`

  const gmailStatus = await getGmailStatus()
  if (gmailStatus.connected) {
    try {
      const result = await sendViaGmail({
        to: candidate.email,
        subject,
        body: body.trim(),
        threadId: lastThreaded?.gmailThreadId ?? undefined,
        inReplyTo: lastThreaded?.gmailMessageId ?? undefined,
      })
      gmailThreadId = result.threadId
      gmailMessageId = result.messageId
    } catch (err) {
      console.error('[inbox reply] gmail failed:', err)
      return NextResponse.json({ error: 'Failed to send via Gmail' }, { status: 500 })
    }
  } else {
    try {
      await sendEmail({
        to: candidate.email,
        subject,
        html: body.trim().replace(/\n/g, '<br>'),
        text: body.trim(),
      })
    } catch (err) {
      console.error('[inbox reply] smtp failed:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  }

  const log = await prisma.messageLog.create({
    data: {
      candidateId,
      subject,
      body: body.trim(),
      sentById: (session.user as any)?.id ?? null,
      sentByName: session.user?.name ?? session.user?.email ?? null,
      direction: 'OUTBOUND',
      read: true,
      gmailThreadId,
      gmailMessageId,
    },
  })

  return NextResponse.json({ ok: true, message: log })
}
