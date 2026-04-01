// Cron handler: sends all scheduled messages whose scheduledFor time has passed.
// Called by Vercel Cron at 9 AM Mon–Fri (see vercel.json).
// IMPORTANT: Set the CRON_SECRET environment variable on Vercel to secure this endpoint.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? ''}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all due scheduled messages
  const due = await prisma.scheduledMessage.findMany({
    where: { scheduledFor: { lte: new Date() }, sentAt: null },
    include: { candidate: true },
  })

  const results = []
  for (const msg of due) {
    try {
      await sendEmail({
        to: msg.candidate.email,
        subject: msg.subject,
        html: msg.body.replace(/\n/g, '<br>'),
        text: msg.body,
      })
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { sentAt: new Date() },
      })
      await prisma.messageLog.create({
        data: {
          candidateId: msg.candidateId,
          templateId: msg.templateId,
          subject: msg.subject,
          body: msg.body,
          sentById: msg.sentById,
          sentByName: msg.sentByName,
        },
      })
      results.push({ id: msg.id, status: 'sent' })
    } catch (err) {
      results.push({ id: msg.id, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
