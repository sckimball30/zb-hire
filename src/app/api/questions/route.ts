import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CompetencyCategory } from '@/types'

const VALID_CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL', 'BEHAVIORAL', 'CULTURE_FIT', 'LEADERSHIP',
  'COMMUNICATION', 'PROBLEM_SOLVING', 'ROLE_SPECIFIC',
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as CompetencyCategory | null

    const questions = await prisma.question.findMany({
      where: {
        isArchived: false,
        ...(category && VALID_CATEGORIES.includes(category) ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('[GET /api/questions]', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, guidance, category, tags } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 })
    }

    const question = await prisma.question.create({
      data: {
        text: text.trim(),
        guidance: guidance?.trim() || null,
        category: category as CompetencyCategory,
        tags: tags?.trim() || null,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('[POST /api/questions]', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
