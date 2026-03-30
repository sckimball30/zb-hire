import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, currentPassword, newPassword } = await req.json()

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // If changing password, verify current password first
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
    const valid = await bcrypt.compare(currentPassword, user.password ?? '')
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    if (newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  // If changing email, check it's not taken
  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'That email is already in use.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name: name.trim() || null }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
    },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(updated)
}
