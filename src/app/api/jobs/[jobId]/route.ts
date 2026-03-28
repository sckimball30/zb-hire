import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { JobStatus } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        interviewers: { include: { interviewer: true } },
        scorecardTemplate: {
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
              include: {
                questions: {
                  orderBy: { sortOrder: 'asc' },
                  include: { question: true },
                },
              },
            },
          },
        },
        applications: {
          include: { candidate: true },
          orderBy: { stageOrder: 'asc' },
        },
        _count: { select: { applications: true } },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('[GET /api/jobs/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json()
    const { title, department, location, description, status, hiringGoal, interviewCount, employmentType, payType, salaryMin, salaryMax, salaryCurrency } = body

    const job = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(department !== undefined && { department: department?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status: status as JobStatus }),
        ...(hiringGoal !== undefined && { hiringGoal: hiringGoal ? Number(hiringGoal) : null }),
        ...(interviewCount !== undefined && { interviewCount: interviewCount ? Number(interviewCount) : 3 }),
        ...(employmentType !== undefined && { employmentType: employmentType || null }),
        ...(payType !== undefined && { payType: payType || null }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? Number(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? Number(salaryMax) : null }),
        ...(salaryCurrency !== undefined && { salaryCurrency: salaryCurrency || 'USD' }),
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('[PATCH /api/jobs/:id]', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    await prisma.job.delete({ where: { id: params.jobId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/:id]', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
