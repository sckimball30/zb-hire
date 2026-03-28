import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * One-time bootstrap: if there is exactly ONE user in the database,
 * promote them to ADMIN. Safe to call multiple times.
 */
export async function POST() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } })

  if (users.length === 0) {
    return NextResponse.json({ error: 'No users found.' }, { status: 404 })
  }

  if (users.length > 1) {
    return NextResponse.json({
      error: 'Multiple users exist. Use the settings page to change roles.',
      users: users.map(u => ({ email: u.email, role: u.role })),
    }, { status: 400 })
  }

  // Exactly one user — promote to ADMIN
  const user = users[0]
  if (user.role === 'ADMIN') {
    return NextResponse.json({ message: 'Already ADMIN.', email: user.email })
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  return NextResponse.json({ ok: true, message: `${user.email} promoted to ADMIN. Please log out and log back in.` })
}
