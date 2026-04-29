import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.companySettings.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json(settings ?? {
    careersPageUrl: null,
    companyName: null,
    heroHeadline: null,
    heroTagline: null,
    careersHeroImageUrl: null,
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { careersPageUrl, companyName, heroHeadline, heroTagline, careersHeroImageUrl } = await req.json()

  const settings = await prisma.companySettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      careersPageUrl: careersPageUrl?.trim() || null,
      companyName: companyName?.trim() || null,
      heroHeadline: heroHeadline?.trim() || null,
      heroTagline: heroTagline?.trim() || null,
      careersHeroImageUrl: careersHeroImageUrl?.trim() || null,
    },
    update: {
      careersPageUrl: careersPageUrl?.trim() || null,
      companyName: companyName?.trim() || null,
      heroHeadline: heroHeadline?.trim() || null,
      heroTagline: heroTagline?.trim() || null,
      careersHeroImageUrl: careersHeroImageUrl?.trim() || null,
    },
  })

  return NextResponse.json(settings)
}
