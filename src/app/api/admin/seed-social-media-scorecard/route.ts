import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Screening is always first — pulled from standard questions already in the DB
const SCREENING_QUESTIONS = [
  "What are your 3 biggest professional strengths?",
  "What would your last manager say is your biggest area for improvement?",
  "If I called your last manager right now, what would they say about you?",
  "What do you know about Wigglitz, and why does this role interest you?",
]

const SECTIONS = [
  {
    title: 'Screening',
    sortOrder: 0,
    questions: SCREENING_QUESTIONS,
  },
  {
    title: 'Experience & Background',
    sortOrder: 1,
    questions: [
      'Have you ever managed a brand\'s socials before?',
      'Have you done contract work before?',
      'Have you made content used for paid ads before? Best example?',
      'Do you have a current job? What was your last job? Why did you leave?',
    ],
  },
  {
    title: 'Technical Skills & Tools',
    sortOrder: 2,
    questions: [
      'How do you edit? What app? Phone or computer?',
      'What equipment do you use?',
      'Do you know how to split test videos?',
    ],
  },
  {
    title: 'Platform & Content Knowledge',
    sortOrder: 3,
    questions: [
      'What platforms do you know best?',
      'How do you balance entertainment vs. ad content ratio?',
      'Name some things that make content feel high quality to you.',
      'What brand do you admire in the social media space?',
    ],
  },
  {
    title: 'Capacity & Workflow',
    sortOrder: 4,
    questions: [
      'How long did the videos you made for us take each?',
      'Have you made a content calendar before?',
      'Have you created systems before?',
      'How is your organization?',
    ],
  },
  {
    title: 'Collaboration & Communication',
    sortOrder: 5,
    questions: [
      'Do you like working alone or with a team?',
      'Have you managed other creators or editors before?',
      'How do you like to be managed? Which communication style works best when receiving feedback?',
      'How do you give feedback to others?',
    ],
  },
  {
    title: 'Mindset & Growth',
    sortOrder: 6,
    questions: [
      'What is your willingness to learn outside of work to perfect your social media understanding?',
      'What motivates you?',
      'Goals long term?',
      'Put these in order from most to least important: money, growth, enjoying what you do each day, impact.',
      'What makes you interested in this?',
    ],
  },
  {
    title: 'Logistics & Flexibility',
    sortOrder: 7,
    questions: [
      'Open to traveling to events for content?',
      'Have you ever interviewed people on the street for content?',
      'Kids, spouse, where do you live?',
    ],
  },
  {
    title: 'Culture Fit & Self-Awareness',
    sortOrder: 8,
    questions: [
      'What makes you a good fit for this role over other candidates?',
      'What are your hobbies?',
      'What is your biggest red flag? Biggest thing you need to improve?',
      'Are you someone who gets offended easily?',
    ],
  },
]

export async function POST() {
  const results: string[] = []

  // Find the Social Media Content Creator job
  const job = await prisma.job.findFirst({
    where: { title: { contains: 'Social Media', mode: 'insensitive' } },
    include: { scorecardTemplate: true },
  })

  if (!job) {
    return NextResponse.json({ ok: false, error: 'Social Media job not found' }, { status: 404 })
  }

  results.push(`Found job: "${job.title}" (${job.id})`)

  // Get or create the template — never delete existing data
  let template = job.scorecardTemplate
  if (!template) {
    template = await prisma.scorecardTemplate.create({
      data: { jobId: job.id, name: 'Social Media Content Creator' },
    })
    results.push(`Created template`)
  } else {
    results.push(`Using existing template: "${template.name}"`)
  }

  // Load existing sections so we can skip ones already present
  const existingSections = await prisma.scorecardTemplateSection.findMany({
    where: { templateId: template.id },
  })
  const existingTitles = new Set(existingSections.map((s) => s.title))

  // Add any missing sections and their questions
  for (const sec of SECTIONS) {
    if (existingTitles.has(sec.title)) {
      results.push(`  SKIP section "${sec.title}" (already exists)`)
      continue
    }

    const section = await prisma.scorecardTemplateSection.create({
      data: { templateId: template.id, title: sec.title, sortOrder: sec.sortOrder },
    })
    results.push(`  ADD section "${sec.title}"`)

    for (let i = 0; i < sec.questions.length; i++) {
      const qText = sec.questions[i]
      let question = await prisma.question.findFirst({ where: { text: qText } })
      if (!question) {
        question = await prisma.question.create({
          data: { text: qText, category: sec.title },
        })
      }
      await prisma.scorecardTemplateQuestion.create({
        data: { sectionId: section.id, questionId: question.id, sortOrder: i, required: false },
      })
      results.push(`    Q: "${qText.slice(0, 60)}"`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
