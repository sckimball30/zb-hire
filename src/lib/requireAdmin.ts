import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Reads the JWT directly from the cookie (bypasses getServerSession issues in App Router),
 * then confirms ADMIN role from the database.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ id: string; role: string } | NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret' })

  if (!token?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: { id: true, role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return user
}

/**
 * Returns the current user's id from the JWT (any role). Returns null if not logged in.
 */
export async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret' })
  return (token?.id as string) ?? null
}
