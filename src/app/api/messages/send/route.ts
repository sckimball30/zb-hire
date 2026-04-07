import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getGmailStatus, sendViaGmail } from '@/lib/gmail'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { candidateId, subject, body, templateId } = await req.json()

  if (!candidateId || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'candidateId, subject and body are required' }, { status: 400 })
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  let gmailThreadId: string | null = null
  let gmailMessageId: string | null = null

  // Check if Gmail is connected — use it for sending if so
  const gmailStatus = await getGmailStatus()
  if (gmailStatus.connected) {
    // Find existing thread for this candidate (for reply threading)
    const existingThread = await prisma.messageLog.findFirst({
      where: { candidateId, gmailThreadId: { not: null } },
      orderBy: { sentAt: 'desc' },
      select: { gmailThreadId: true, gmailMessageId: true },
    })

    try {
      const result = await sendViaGmail({
        to: candidate.email,
        subject: subject.trim(),
        body,
        threadId: existingThread?.gmailThreadId ?? undefined,
        inReplyTo: existingThread?.gmailMessageId ?? undefined,
      })
      gmailThreadId = result.threadId
      gmailMessageId = result.messageId
    } catch (err) {
      console.error('[send via gmail]', err)
      return NextResponse.json({ error: 'Failed to send via Gmail. Check connection in Settings.' }, { status: 500 })
    }
  } else {
    // Fall back to SMTP
    try {
      await sendEmail({
        to: candidate.email,
        subject: subject.trim(),
        html: body.replace(/\n/g, '<br>'),
        text: body,
      })
    } catch (err) {
      console.error('[send email]', err)
      return NextResponse.json({ error: 'Failed to send email. Check SMTP settings.' }, { status: 500 })
    }
  }

  await prisma.messageLog.create({
    data: {
      candidateId,
      templateId: templateId || null,
      subject: subject.trim(),
      body: body.trim(),
      sentById: (session?.user as any)?.id ?? null,
      sentByName: session?.user?.name ?? session?.user?.email ?? null,
      direction: 'OUTBOUND',
      read: true,
      gmailThreadId,
      gmailMessageId,
    },
  })

  return NextResponse.json({ ok: true })
}
