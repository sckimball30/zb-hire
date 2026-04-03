import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendApplicationConfirmation } from '@/lib/automations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidateId, jobId } = body

    if (!candidateId || !jobId) {
      return NextResponse.json({ error: 'candidateId and jobId are required' }, { status: 400 })
    }

    // Check for duplicate
    const existing = await prisma.application.findUnique({
      where: { candidateId_jobId: { candidateId, jobId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Candidate already applied to this job' }, { status: 409 })
    }

    const application = await prisma.application.create({
      data: { candidateId, jobId },
      include: { candidate: true, job: true },
    })

    // Log creation
    await prisma.activityLog.create({
      data: {
        applicationId: application.id,
        action: 'Application created',
        actorName: 'System',
      },
    })

    // Send confirmation email to candidate (if automation is enabled)
    await sendApplicationConfirmation({
      candidateEmail: application.candidate.email,
      firstName: application.candidate.firstName,
      fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      jobTitle: application.job.title,
      department: application.job.department,
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('[POST /api/applications]', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
