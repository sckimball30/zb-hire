import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const { role } = await req.json()
  const user = await prisma.user.update({
    where: { id: params.userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })
  return NextResponse.json(user)
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
