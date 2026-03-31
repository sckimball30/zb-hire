import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const automations = await prisma.emailAutomation.findMany()
  return NextResponse.json(automations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { type, subject, body, enabled } = await req.json()
  const automation = await prisma.emailAutomation.upsert({
    where: { type },
    create: { type, subject, body, enabled: enabled ?? true },
    update: { subject, body, ...(enabled !== undefined && { enabled }) },
  })
  return NextResponse.json(automation)
}
