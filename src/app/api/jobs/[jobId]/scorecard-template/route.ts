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

    type IncomingSection = {
      title: string
      sortOrder?: number
      questions?: Array<{ questionId: string; sortOrder?: number; required?: boolean }>
    }

    const incomingSections: IncomingSection[] = sections || []

    // ── Get or create the template (never delete) ───────────────────────────
    let template = await prisma.scorecardTemplate.findUnique({
      where: { jobId: params.jobId },
      include: {
        sections: {
          include: { questions: true },
        },
      },
    })

    if (!template) {
      template = await prisma.scorecardTemplate.create({
        data: { jobId: params.jobId, name: name.trim() },
        include: { sections: { include: { questions: true } } },
      }) as typeof template
    } else {
      // Update the template name
      await prisma.scorecardTemplate.update({
        where: { id: template.id },
        data: { name: name.trim() },
      })
    }

    // ── Merge sections: keep existing ones present in the payload, add new ──
    // Map existing sections by title for quick lookup
    const existingByTitle = new Map(template!.sections.map(s => [s.title, s]))
    const incomingTitles = new Set(incomingSections.map(s => s.title))

    // Delete sections that were explicitly removed (in DB but not in payload)
    const sectionsToDelete = template!.sections.filter(s => !incomingTitles.has(s.title))
    for (const sec of sectionsToDelete) {
      await prisma.scorecardTemplateSection.delete({ where: { id: sec.id } })
    }

    // Upsert each incoming section
    for (let sIdx = 0; sIdx < incomingSections.length; sIdx++) {
      const sec = incomingSections[sIdx]
      const existing = existingByTitle.get(sec.title)

      if (existing) {
        // Update sort order
        await prisma.scorecardTemplateSection.update({
          where: { id: existing.id },
          data: { sortOrder: sec.sortOrder ?? sIdx },
        })

        // Sync questions: remove old, add new (by questionId)
        const existingQIds = new Set(existing.questions.map(q => q.questionId))
        const incomingQIds = new Set((sec.questions ?? []).map(q => q.questionId))

        // Remove questions no longer in this section
        const qsToDelete = existing.questions.filter(q => !incomingQIds.has(q.questionId))
        for (const q of qsToDelete) {
          await prisma.scorecardTemplateQuestion.delete({ where: { id: q.id } })
        }

        // Add new questions
        const newQuestions = (sec.questions ?? []).filter(q => !existingQIds.has(q.questionId))
        for (let qIdx = 0; qIdx < newQuestions.length; qIdx++) {
          const q = newQuestions[qIdx]
          await prisma.scorecardTemplateQuestion.create({
            data: {
              sectionId: existing.id,
              questionId: q.questionId,
              sortOrder: q.sortOrder ?? qIdx,
              required: q.required ?? false,
            },
          })
        }

        // Update sort orders for questions still present
        const keptQuestions = (sec.questions ?? []).filter(q => existingQIds.has(q.questionId))
        for (let qIdx = 0; qIdx < keptQuestions.length; qIdx++) {
          const q = keptQuestions[qIdx]
          const existingQ = existing.questions.find(eq => eq.questionId === q.questionId)
          if (existingQ) {
            await prisma.scorecardTemplateQuestion.update({
              where: { id: existingQ.id },
              data: { sortOrder: q.sortOrder ?? qIdx, required: q.required ?? false },
            })
          }
        }
      } else {
        // New section — create it
        await prisma.scorecardTemplateSection.create({
          data: {
            templateId: template!.id,
            title: sec.title,
            sortOrder: sec.sortOrder ?? sIdx,
            questions: {
              create: (sec.questions ?? []).map((q, qIdx) => ({
                questionId: q.questionId,
                sortOrder: q.sortOrder ?? qIdx,
                required: q.required ?? false,
              })),
            },
          },
        })
      }
    }

    // Return the updated template
    const updated = await prisma.scorecardTemplate.findUnique({
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PUT /api/jobs/:id/scorecard-template]', error)
    return NextResponse.json({ error: 'Failed to upsert template' }, { status: 500 })
  }
}
