import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Indeed Apply webhook endpoint.
 *
 * Configure in your Indeed Employer dashboard:
 *   Webhook URL: https://<your-domain>/api/webhooks/indeed
 *   Shared secret: set WEBHOOK_SECRET_INDEED in env
 *
 * Expected payload (Indeed Apply API format):
 * {
 *   "applicant": {
 *     "name": { "formattedName": "Jane Smith" },
 *     "email": "jane@example.com",
 *     "phoneNumber": "+1-555-0100"
 *   },
 *   "job": {
 *     "referenceNumber": "<your-internal-job-id>"
 *   },
 *   "resumeUrl": "https://..."
 * }
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // HMAC-SHA256 signature verification (Indeed standard)
  const secret = process.env.WEBHOOK_SECRET_INDEED
  if (secret) {
    const sig = req.headers.get('x-indeed-signature') ?? ''
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (sig !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Record<string, any>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const applicant = body.applicant ?? {}
  const jobRef = body.job?.referenceNumber ?? body.jobId ?? null

  const email: string = applicant.email ?? ''
  const fullName: string = applicant.name?.formattedName ?? ''
  const [firstName = '', ...rest] = fullName.trim().split(' ')
  const lastName = rest.join(' ') || 'Unknown'
  const phone: string | null = applicant.phoneNumber ?? null
  const resumeUrl: string | null = body.resumeUrl ?? null

  if (!email || !firstName) {
    return NextResponse.json({ error: 'applicant.email and applicant.name are required' }, { status: 400 })
  }

  const candidate = await prisma.candidate.upsert({
    where: { email },
    create: { firstName, lastName, email, phone, resumeUrl, source: 'Indeed' },
    update: { phone: phone ?? undefined, resumeUrl: resumeUrl ?? undefined },
  })

  if (jobRef) {
    const job = await prisma.job.findUnique({ where: { id: jobRef } })
    if (job) {
      const existing = await prisma.application.findUnique({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId: jobRef } },
      })
      if (!existing) {
        const app = await prisma.application.create({
          data: { candidateId: candidate.id, jobId: jobRef, stage: 'APPLIED' },
        })
        await prisma.activityLog.create({
          data: {
            applicationId: app.id,
            action: 'Application received via Indeed',
            actorName: 'Indeed',
          },
        })
      }
    }
  }

  return NextResponse.json({ ok: true, candidateId: candidate.id })
}
