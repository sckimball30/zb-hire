import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_TAGS = [
  { name: 'Silver Medalist', color: '#9ca3af' },
  { name: 'Strong Culture Fit', color: '#4AFFD2' },
  { name: 'Future Consideration', color: '#3AADE0' },
  { name: 'Passive Candidate', color: '#a78bfa' },
  { name: 'Not a Fit', color: '#f87171' },
  { name: 'Do Not Contact', color: '#ef4444' },
]

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      create: tag,
      update: {},
    })
  }
  return NextResponse.json({ ok: true })
}
