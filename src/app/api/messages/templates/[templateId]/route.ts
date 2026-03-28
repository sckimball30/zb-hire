import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { templateId: string } }) {
  const template = await prisma.messageTemplate.findUnique({ where: { id: params.templateId } })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(template)
}

export async function PATCH(req: NextRequest, { params }: { params: { templateId: string } }) {
  const data = await req.json()
  const template = await prisma.messageTemplate.update({
    where: { id: params.templateId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.body !== undefined && { body: data.body }),
    },
  })
  return NextResponse.json(template)
}

export async function DELETE(_: NextRequest, { params }: { params: { templateId: string } }) {
  await prisma.messageTemplate.delete({ where: { id: params.templateId } })
  return NextResponse.json({ ok: true })
}
