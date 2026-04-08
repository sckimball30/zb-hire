import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetJobId, closeOriginal } = await req.json()

  if (!targetJobId) {
    return NextResponse.json({ error: 'targetJobId is required' }, { status: 400 })
  }

  const original = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { candidate: true, job: true },
  })
  if (!original) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // Make sure target job exists
  const targetJob = await prisma.job.findUnique({ where: { id: targetJobId } })
  if (!targetJob) return NextResponse.json({ error: 'Target job not found' }, { status: 404 })

  // Check for existing application to target job
  const existing = await prisma.application.findUnique({
    where: { candidateId_jobId: { candidateId: original.candidateId, jobId: targetJobId } },
  })
  if (existing) {
    return NextResponse.json(
      { error: `${original.candidate.firstName} already has an application for ${targetJob.title}` },
      { status: 409 }
    )
  }

  // Create new application on the target job — carry stage over
  const newApp = await prisma.application.create({
    data: {
      candidateId: original.candidateId,
      jobId: targetJobId,
      stage: original.stage,
      stageOrder: original.stageOrder,
      starRating: original.starRating,
      availableStart: original.availableStart,
      salaryExpectation: original.salaryExpectation,
    },
  })

  // Log on new application
  await prisma.activityLog.create({
    data: {
      applicationId: newApp.id,
      action: `Transferred from ${original.job.title}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  // Log on original application
  await prisma.activityLog.create({
    data: {
      applicationId: original.id,
      action: `Transferred to ${targetJob.title}`,
      actorName: session.user?.name ?? session.user?.email ?? 'Unknown',
    },
  })

  // Close original if requested
  if (closeOriginal) {
    await prisma.application.update({
      where: { id: original.id },
      data: { stage: 'REJECTED', rejectedAt: new Date() },
    })
  }

  return NextResponse.json({ applicationId: newApp.id }, { status: 201 })
}
