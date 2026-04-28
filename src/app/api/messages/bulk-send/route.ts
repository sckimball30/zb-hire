import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getGmailStatus, sendViaGmail } from '@/lib/gmail'

/** Substitute per-candidate variables in a template string */
function substituteCandidateVars(
  text: string,
  vars: { firstName: string; lastName: string; jobTitle: string; manualVars: Record<string, string> }
): string {
  let out = text

  // Auto-personalized per candidate
  const auto: Record<string, string> = {
    'First Name': vars.firstName,
    'firstName': vars.firstName,
    'Last Name': vars.lastName,
    'lastName': vars.lastName,
    'Full Name': `${vars.firstName} ${vars.lastName}`,
    'fullName': `${vars.firstName} ${vars.lastName}`,
    'Job Title': vars.jobTitle,
    'jobTitle': vars.jobTitle,
  }

  for (const [k, v] of Object.entries(auto)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }

  // Manual vars (same for all recipients, filled by the user in the modal)
  for (const [k, v] of Object.entries(vars.manualVars)) {
    if (v) out = out.replaceAll(`{{${k}}}`, v)
  }

  return out
}

/** POST /api/messages/bulk-send — send a personalized message to multiple candidates */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationIds, subject, body, templateId, manualVars = {} } = await req.json()

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return NextResponse.json({ error: 'applicationIds is required' }, { status: 400 })
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  const applications = await prisma.application.findMany({
    where: { id: { in: applicationIds } },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, email: true, blocked: true } },
      job: { select: { title: true } },
    },
  })

  const gmailStatus = await getGmailStatus()
  const sentById = (session.user as any)?.id ?? null
  const sentByName = session.user?.name ?? session.user?.email ?? null

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const app of applications) {
    const { candidate, job } = app
    if (candidate.blocked) {
      errors.push(`${candidate.firstName} ${candidate.lastName}: Do Not Contact`)
      failed++
      continue
    }

    const personalizedSubject = substituteCandidateVars(subject, {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      jobTitle: job.title,
      manualVars,
    })

    const personalizedBody = substituteCandidateVars(body, {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      jobTitle: job.title,
      manualVars,
    })

    let gmailThreadId: string | null = null
    let gmailMessageId: string | null = null

    try {
      if (gmailStatus.connected) {
        const existingThread = await prisma.messageLog.findFirst({
          where: { candidateId: candidate.id, gmailThreadId: { not: null } },
          orderBy: { sentAt: 'desc' },
          select: { gmailThreadId: true, gmailMessageId: true },
        })
        const result = await sendViaGmail({
          to: candidate.email,
          subject: personalizedSubject,
          body: personalizedBody,
          threadId: existingThread?.gmailThreadId ?? undefined,
          inReplyTo: existingThread?.gmailMessageId ?? undefined,
        })
        gmailThreadId = result.threadId
        gmailMessageId = result.messageId
      } else {
        await sendEmail({
          to: candidate.email,
          subject: personalizedSubject,
          html: personalizedBody.replace(/\n/g, '<br>'),
          text: personalizedBody,
        })
      }

      await prisma.messageLog.create({
        data: {
          candidateId: candidate.id,
          templateId: templateId || null,
          subject: personalizedSubject,
          body: personalizedBody,
          sentById,
          sentByName,
          direction: 'OUTBOUND',
          read: true,
          gmailThreadId,
          gmailMessageId,
        },
      })

      sent++
    } catch (err: any) {
      console.error(`[bulk-send] failed for ${candidate.email}:`, err)
      errors.push(`${candidate.firstName} ${candidate.lastName}: ${err?.message ?? 'Unknown error'}`)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, errors })
}
