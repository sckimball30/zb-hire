import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

const PROFILE_ROLES = ['RECRUITER', 'INTERVIEWER', 'HIRING_MANAGER']

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const { role, title, calendlyUrl } = await req.json()

  // Update the user's role if provided
  const user = await prisma.user.update({
    where: { id: params.userId },
    data: { ...(role !== undefined && { role }) },
    select: { id: true, name: true, email: true, role: true },
  })

  const effectiveRole = role ?? user.role

  if (user.email) {
    const needsProfile = PROFILE_ROLES.includes(effectiveRole)
    const hasProfileUpdate = title !== undefined || calendlyUrl !== undefined

    if (needsProfile || hasProfileUpdate) {
      await prisma.interviewer.upsert({
        where: { email: user.email },
        update: {
          userId: user.id,
          name: user.name ?? user.email,
          ...(title !== undefined && { title: title || null }),
          ...(calendlyUrl !== undefined && { calendlyUrl: calendlyUrl || null }),
        },
        create: {
          email: user.email,
          name: user.name ?? user.email,
          userId: user.id,
          ...(title !== undefined && { title: title || null }),
          ...(calendlyUrl !== undefined && { calendlyUrl: calendlyUrl || null }),
        },
      })
    }
  }

  // Return full user with profile
  const full = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      interviewerProfile: { select: { id: true, title: true, calendlyUrl: true } },
    },
  })
  return NextResponse.json(full)
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  if (admin.id === params.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })
  }
  await prisma.user.delete({ where: { id: params.userId } })
  return NextResponse.json({ ok: true })
}
