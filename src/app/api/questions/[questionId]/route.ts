import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CompetencyCategory } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('[GET /api/questions/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const body = await request.json()
    const { text, guidance, category, tags, isArchived } = body

    const question = await prisma.question.update({
      where: { id: params.questionId },
      data: {
        ...(text !== undefined && { text: text.trim() }),
        ...(guidance !== undefined && { guidance: guidance?.trim() || null }),
        ...(category !== undefined && { category: category as CompetencyCategory }),
        ...(tags !== undefined && { tags: tags?.trim() || null }),
        ...(isArchived !== undefined && { isArchived: Boolean(isArchived) }),
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('[PATCH /api/questions/:id]', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}
