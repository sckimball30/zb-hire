import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * LinkedIn Apply webhook endpoint.
 *
 * Configure in your LinkedIn Job Posting settings:
 *   Webhook URL: https://<your-domain>/api/webhooks/linkedin
 *   Shared secret: set WEBHOOK_SECRET_LINKEDIN in env
 *
 * Expected payload (LinkedIn Easy Apply / ATS integration format):
 * {
 *   "firstName": "Jane",
 *   "lastName": "Smith",
 *   "email": "jane@example.com",
 *   "phone": "+1-555-0100",
 *   "linkedInProfileUrl": "https://linkedin.com/in/janesmith",
 *   "jobId": "<your-internal-job-id>",   // passed via LinkedIn job posting URL param
 *   "jobTitle": "Senior Engineer",
 *   "resumeUrl": "https://..."
 * }
 */
export async function POST(req: NextRequest) {
  // Optional signature verification
  const secret = process.env.WEBHOOK_SECRET_LINKEDIN
  if (secret) {
    const sig = req.headers.get('x-linkedin-signature') ?? req.headers.get('x-hub-signature-256') ?? ''
    if (!sig.includes(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { firstName, lastName, email, phone, linkedInProfileUrl, jobId, resumeUrl } = body

  if (!email || !firstName || !lastName) {
    return NextResponse.json({ error: 'firstName, lastName and email are required' }, { status: 400 })
  }

  // Upsert candidate
  const candidate = await prisma.candidate.upsert({
    where: { email },
    create: { firstName, lastName, email, phone: phone ?? null, linkedInUrl: linkedInProfileUrl ?? null, resumeUrl: resumeUrl ?? null, source: 'LinkedIn' },
    update: { phone: phone ?? undefined, linkedInUrl: linkedInProfileUrl ?? undefined, resumeUrl: resumeUrl ?? undefined },
  })

  // Create application if jobId provided and no duplicate
  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (job) {
      const existing = await prisma.application.findUnique({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
      })
      if (!existing) {
        await prisma.application.create({
          data: { candidateId: candidate.id, jobId, stage: 'APPLIED' },
        })
        await prisma.activityLog.create({
          data: {
            applicationId: (await prisma.application.findUnique({
              where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
              select: { id: true },
            }))!.id,
            action: 'Application received via LinkedIn',
            actorName: 'LinkedIn',
          },
        })
      }
    }
  }

  return NextResponse.json({ ok: true, candidateId: candidate.id })
}
