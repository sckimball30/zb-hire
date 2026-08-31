export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function findValidToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  })
  if (!record) return null
  if (record.usedAt) return null
  if (record.expiresAt < new Date()) return null
  return record
}

// Lets the reset page tell the user the link is dead before they fill the form.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })
  const record = await findValidToken(token)
  return NextResponse.json({ valid: Boolean(record) })
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const record = await findValidToken(token)
    if (!record) {
      return NextResponse.json(
        { error: 'This reset link has expired or already been used. Request a new one.' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
