import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const template = await prisma.scorecardTemplate.findUnique({
      where: { jobId: params.jobId },
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
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('[GET /api/jobs/:id/scorecard-template]', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json()
    const { name, sections } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    // Delete existing template (cascade will remove sections + questions)
    await prisma.scorecardTemplate.deleteMany({ where: { jobId: params.jobId } })

    const template = await prisma.scorecardTemplate.create({
      data: {
        jobId: params.jobId,
        name: name.trim(),
        sections: {
          create: (sections || []).map((section: {
            title: string
            sortOrder?: number
            questions?: Array<{ questionId: string; sortOrder?: number; required?: boolean }>
          }, sIdx: number) => ({
            title: section.title,
            sortOrder: section.sortOrder ?? sIdx,
            questions: {
              create: (section.questions || []).map((q: {
                questionId: string
                sortOrder?: number
                required?: boolean
              }, qIdx: number) => ({
                questionId: q.questionId,
                sortOrder: q.sortOrder ?? qIdx,
                required: q.required ?? false,
              })),
            },
          })),
        },
      },
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
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('[PUT /api/jobs/:id/scorecard-template]', error)
    return NextResponse.json({ error: 'Failed to upsert template' }, { status: 500 })
  }
}
