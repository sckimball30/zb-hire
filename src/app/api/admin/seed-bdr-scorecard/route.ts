import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BDR_SECOND_INTERVIEW_QUESTIONS = [
  {
    text: 'What are your 3 biggest weaknesses?',
    category: 'BEHAVIORAL',
  },
  {
    text: "Tell me about a time you had to put out serious volume — calls, outreach, meetings, whatever the role demanded. What did that look like and how did you sustain it?",
    category: 'BEHAVIORAL',
  },
  {
    text: "What kind of environment brings out your best work, and what have you done to make a team better, not just be on the team?",
    category: 'CULTURE_FIT',
  },
  {
    text: 'What is something that would offend you?',
    category: 'CULTURE_FIT',
  },
  {
    text: "Tell me about a time you gave someone feedback they didn't ask for. Why did you give it, how did you deliver it?",
    category: 'BEHAVIORAL',
  },
  {
    text: "What's the hardest role you've ever been in? Not just hard tasks — hard in terms of what you had to do to succeed.",
    category: 'BEHAVIORAL',
  },
]

export async function POST() {
  const results: string[] = []

  // Find the BDR job
  const job = await prisma.job.findFirst({
    where: { title: { contains: 'BDR', mode: 'insensitive' } },
    include: { scorecardTemplate: true },
  })

  if (!job) {
    return NextResponse.json({ ok: false, error: 'BDR job not found' }, { status: 404 })
  }

  results.push(`Found job: "${job.title}" (${job.id})`)

  // Get or create the template
  let template = job.scorecardTemplate
  if (!template) {
    template = await prisma.scorecardTemplate.create({
      data: { jobId: job.id, name: 'BDR Interview Scorecard' },
    })
    results.push('Created new scorecard template')
  } else {
    results.push(`Using existing template: "${template.name}"`)
  }

  // Check if this section already exists
  const existingSections = await prisma.scorecardTemplateSection.findMany({
    where: { templateId: template.id },
    orderBy: { sortOrder: 'asc' },
  })

  const sectionTitle = 'BDR Second Interview'
  if (existingSections.some((s) => s.title === sectionTitle)) {
    return NextResponse.json({
      ok: true,
      results: [...results, `SKIP: section "${sectionTitle}" already exists`],
    })
  }

  // Place this section right after Screening (sortOrder 1), push others down
  const screeningSection = existingSections.find((s) =>
    s.title.toLowerCase().includes('screen')
  )
  const insertAt = screeningSection ? (screeningSection.sortOrder ?? 0) + 1 : 1

  // Bump sortOrder of any sections that would be at or after insertAt
  for (const sec of existingSections) {
    if ((sec.sortOrder ?? 0) >= insertAt) {
      await prisma.scorecardTemplateSection.update({
        where: { id: sec.id },
        data: { sortOrder: (sec.sortOrder ?? 0) + 1 },
      })
    }
  }

  // Create the section
  const section = await prisma.scorecardTemplateSection.create({
    data: { templateId: template.id, title: sectionTitle, sortOrder: insertAt },
  })
  results.push(`Added section "${sectionTitle}" at sortOrder ${insertAt}`)

  // Create questions and link them
  for (let i = 0; i < BDR_SECOND_INTERVIEW_QUESTIONS.length; i++) {
    const { text, category } = BDR_SECOND_INTERVIEW_QUESTIONS[i]

    let question = await prisma.question.findFirst({ where: { text } })
    if (!question) {
      question = await prisma.question.create({ data: { text, category } })
      results.push(`  CREATE question: "${text.slice(0, 70)}…"`)
    } else {
      results.push(`  REUSE question: "${text.slice(0, 70)}…"`)
    }

    await prisma.scorecardTemplateQuestion.create({
      data: {
        sectionId: section.id,
        questionId: question.id,
        sortOrder: i,
        required: false,
      },
    })
  }

  return NextResponse.json({ ok: true, results })
}
