import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const templates = await prisma.messageTemplate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const { name, subject, body } = await req.json()
  if (!name?.trim() || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'name, subject and body are required' }, { status: 400 })
  }
  const template = await prisma.messageTemplate.create({
    data: { name: name.trim(), subject: subject.trim(), body: body.trim() },
  })
  return NextResponse.json(template, { status: 201 })
}
