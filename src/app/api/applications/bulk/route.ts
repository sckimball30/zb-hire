import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ALL_STAGES } from '@/lib/constants'

/** PATCH /api/applications/bulk — move multiple applications to a new stage */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationIds, stage } = await req.json()

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return NextResponse.json({ error: 'applicationIds is required' }, { status: 400 })
  }
  if (!stage || !ALL_STAGES.includes(stage)) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
  }

  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const [updated] = await prisma.$transaction([
    prisma.application.updateMany({
      where: { id: { in: applicationIds } },
      data: { stage },
    }),
  ])

  // Log activity for each application (non-blocking)
  prisma.activityLog.createMany({
    data: applicationIds.map((id: string) => ({
      applicationId: id,
      action: `Stage moved to ${stage.replace('_', ' ')} (bulk)`,
      actorName,
    })),
  }).catch(err => console.error('[bulk stage] activity log failed:', err))

  return NextResponse.json({ updated: updated.count })
}
