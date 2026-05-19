import { google } from 'googleapis'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { stripEmailQuote } from '@/lib/utils'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl() {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function getGmailClient() {
  const conn = await prisma.gmailConnection.findFirst()
  if (!conn) throw new Error('No Gmail account connected')

  const client = getOAuth2Client()
  client.setCredentials({
    access_token: conn.accessToken,
    refresh_token: conn.refreshToken,
    expiry_date: conn.expiresAt.getTime(),
  })

  // Auto-refresh if token is expired or expires within 5 minutes
  if (conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken()
    await prisma.gmailConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date!),
      },
    })
    client.setCredentials(credentials)
  }

  return { gmail: google.gmail({ version: 'v1', auth: client }), fromEmail: conn.email }
}

export const getGmailStatus = unstable_cache(
  async (): Promise<{ connected: boolean; email?: string }> => {
    const conn = await prisma.gmailConnection.findFirst()
    if (!conn) return { connected: false }
    return { connected: true, email: conn.email }
  },
  ['gmail-status'],
  { revalidate: 300 }
)

function makeRawEmail({
  from,
  to,
  subject,
  body,
  inReplyTo,
  references,
}: {
  from: string
  to: string
  subject: string
  body: string
  inReplyTo?: string
  references?: string
}): string {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
  ]
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`)
  if (references) lines.push(`References: ${references}`)
  lines.push('', body)

  const raw = lines.join('\r\n')
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendViaGmail({
  to,
  subject,
  body,
  threadId,
  inReplyTo,
}: {
  to: string
  subject: string
  body: string
  threadId?: string
  inReplyTo?: string
}): Promise<{ messageId: string; threadId: string }> {
  const { gmail, fromEmail } = await getGmailClient()

  const raw = makeRawEmail({
    from: fromEmail,
    to,
    subject: threadId ? `Re: ${subject.replace(/^Re: /i, '')}` : subject,
    body,
    inReplyTo,
    references: inReplyTo,
  })

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, ...(threadId ? { threadId } : {}) },
  })

  return {
    messageId: res.data.id!,
    threadId: res.data.threadId!,
  }
}

function decodeBase64(data: string): string {
  try {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

function extractBody(payload: any): string {
  if (!payload) return ''

  // Direct body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // Multipart — prefer text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
    // Fallback to any part with data
    for (const part of payload.parts) {
      const body = extractBody(part)
      if (body) return body
    }
  }

  return ''
}

function getHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

export async function syncThreadReplies(candidateId: string): Promise<number> {
  const { gmail } = await getGmailClient()

  // Get all outbound logs with a gmailThreadId for this candidate
  const outboundLogs = await prisma.messageLog.findMany({
    where: { candidateId, direction: 'OUTBOUND', gmailThreadId: { not: null } },
    select: { gmailThreadId: true },
    distinct: ['gmailThreadId'],
  })

  if (outboundLogs.length === 0) return 0

  // Get existing inbound message IDs to avoid duplicates
  const existing = await prisma.messageLog.findMany({
    where: { candidateId, direction: 'INBOUND' },
    select: { gmailMessageId: true },
  })
  const existingIds = new Set(existing.map(e => e.gmailMessageId))

  let newCount = 0

  for (const log of outboundLogs) {
    if (!log.gmailThreadId) continue

    try {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: log.gmailThreadId,
        format: 'full',
      })

      const messages = thread.data.messages ?? []

      for (const msg of messages) {
        const msgId = msg.id!
        if (existingIds.has(msgId)) continue

        const headers = msg.payload?.headers ?? []
        const from = getHeader(headers, 'from')
        const subject = getHeader(headers, 'subject')
        const dateStr = getHeader(headers, 'date')
        const body = extractBody(msg.payload)

        // Skip our own outbound messages (already logged)
        const { fromEmail } = await getGmailClient()
        if (from.toLowerCase().includes(fromEmail.toLowerCase())) continue

        // Skip mailer-daemon bounce notifications (delivery failure reports)
        const fromLower = from.toLowerCase()
        if (
          fromLower.includes('mailer-daemon') ||
          fromLower.includes('postmaster') ||
          fromLower.includes('mail delivery') ||
          subject.toLowerCase().includes('delivery incomplete') ||
          subject.toLowerCase().includes('delivery status notification') ||
          subject.toLowerCase().includes('undeliverable')
        ) continue

        const sentAt = dateStr ? new Date(dateStr) : new Date()

        await prisma.messageLog.create({
          data: {
            candidateId,
            subject,
            body: stripEmailQuote(body) || '(no body)',
            sentAt,
            direction: 'INBOUND',
            read: false,
            gmailThreadId: log.gmailThreadId,
            gmailMessageId: msgId,
            sentByName: from,
          },
        })

        existingIds.add(msgId)
        newCount++
      }
    } catch (err) {
      console.error(`[gmail] Failed to sync thread ${log.gmailThreadId}:`, err)
    }
  }

  return newCount
}
