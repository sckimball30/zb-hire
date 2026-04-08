import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.companySettings.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json(settings ?? { careersPageUrl: null, companyName: null })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { careersPageUrl, companyName } = await req.json()

  const settings = await prisma.companySettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      careersPageUrl: careersPageUrl?.trim() || null,
      companyName: companyName?.trim() || null,
    },
    update: {
      careersPageUrl: careersPageUrl?.trim() || null,
      companyName: companyName?.trim() || null,
    },
  })

  return NextResponse.json(settings)
}
