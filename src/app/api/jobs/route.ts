import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { JobStatus } from '@/types'

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        _count: {
          select: { applications: true, interviewers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('[GET /api/jobs]', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, department, location, description, status, hiringGoal, employmentType, salaryMin, salaryMax, salaryCurrency } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        department: department?.trim() || null,
        location: location?.trim() || null,
        description: description?.trim() || null,
        status: (status as JobStatus) || 'DRAFT',
        hiringGoal: hiringGoal ? Number(hiringGoal) : null,
        employmentType: employmentType || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryCurrency: salaryCurrency || 'USD',
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('[POST /api/jobs]', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
