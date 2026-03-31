import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { sendNewApplicationEmail } from '@/lib/email'
import { sendApplicationConfirmation } from '@/lib/automations'

// Public GET — returns job info for the apply page (no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: {
      id: true, title: true, department: true, location: true,
      description: true, status: true, employmentType: true,
      payType: true, salaryMin: true, salaryMax: true, salaryCurrency: true,
    },
  })

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.status === 'DRAFT') return NextResponse.json({ error: 'draft' }, { status: 404 })
  if (job.status === 'CLOSED' || job.status === 'ARCHIVED') return NextResponse.json({ error: 'closed' }, { status: 404 })

  return NextResponse.json(job)
}

// Public POST — submit application with resume upload (no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
  let firstName: string, lastName: string, email: string
  let phone = '', address = '', linkedInUrl = '', coverLetter = ''
  let resumeUrl: string | null = null

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData()
    firstName = (fd.get('firstName') as string)?.trim() ?? ''
    lastName  = (fd.get('lastName')  as string)?.trim() ?? ''
    email     = (fd.get('email')     as string)?.trim() ?? ''
    phone     = (fd.get('phone')     as string)?.trim() ?? ''
    address   = (fd.get('address')   as string)?.trim() ?? ''
    linkedInUrl  = (fd.get('linkedInUrl')  as string)?.trim() ?? ''
    coverLetter  = (fd.get('coverLetter')  as string)?.trim() ?? ''

    const resumeFile = fd.get('resume') as File | null
    if (resumeFile && resumeFile.size > 0) {
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
        console.log('Resume upload attempt — token present:', !!token, '| file:', resumeFile.name, resumeFile.size, 'bytes')
        const safeName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filename = `resumes/${Date.now()}-${safeName}`
        const blob = await put(filename, resumeFile, { access: 'private', token })
        resumeUrl = blob.url
        console.log('Resume upload success:', resumeUrl)
      } catch (uploadErr: any) {
        console.error('Resume upload failed:', uploadErr?.message ?? uploadErr)
      }
    }
  } else {
    // Fallback JSON (e.g. webhooks)
    const body = await req.json()
    ;({ firstName, lastName, email, phone, address, linkedInUrl, coverLetter } = body)
  }

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'First name, last name, and email are required.' }, { status: 400 })
  }

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: {
      id: true, status: true, title: true, department: true,
      recruiters: {
        where: { isMain: true, emailNotifications: true },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })
  if (!job || job.status !== 'OPEN') {
    return NextResponse.json({ error: 'This position is not currently accepting applications.' }, { status: 400 })
  }

  // Upsert candidate
  const candidate = await prisma.candidate.upsert({
    where: { email: email.trim().toLowerCase() },
    create: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      address: address || null,
      linkedInUrl: linkedInUrl || null,
      resumeUrl: resumeUrl,
      notes: coverLetter || null,
      source: 'Direct Apply',
    },
    update: {
      phone: phone || undefined,
      address: address || undefined,
      linkedInUrl: linkedInUrl || undefined,
      ...(resumeUrl ? { resumeUrl } : {}),
    },
  })

  // Check for duplicate application
  const existing = await prisma.application.findUnique({
    where: { candidateId_jobId: { candidateId: candidate.id, jobId: params.jobId } },
  })
  if (existing) return NextResponse.json({ ok: true, alreadyApplied: true })

  const application = await prisma.application.create({
    data: { candidateId: candidate.id, jobId: params.jobId, stage: 'APPLIED' },
  })

  await prisma.activityLog.create({
    data: {
      applicationId: application.id,
      action: 'Application submitted via public apply form',
      actorName: `${firstName.trim()} ${lastName.trim()}`,
    },
  })

  if (coverLetter?.trim()) {
    await prisma.candidateNote.create({
      data: {
        candidateId: candidate.id,
        content: `Cover letter:\n\n${coverLetter.trim()}`,
        authorName: 'Applicant',
      },
    })
  }

  // Send application confirmation to candidate
  sendApplicationConfirmation({
    candidateEmail: email.trim().toLowerCase(),
    firstName: firstName.trim(),
    fullName: `${firstName.trim()} ${lastName.trim()}`,
    jobTitle: job.title,
    department: job.department,
  }).catch(() => {})

  // Notify main recruiter(s) with email alerts enabled
  for (const assignment of job.recruiters) {
    if (assignment.user.email) {
      sendNewApplicationEmail({
        to: assignment.user.email,
        recruiterName: assignment.user.name ?? 'Recruiter',
        candidateName: `${firstName.trim()} ${lastName.trim()}`,
        jobTitle: job.title,
        jobId: job.id,
      }).catch(() => {}) // fire-and-forget
    }
  }

  return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Apply submission error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
