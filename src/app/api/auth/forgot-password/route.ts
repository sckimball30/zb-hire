export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

const EXPIRY_MINUTES = 60

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true },
    })

    // Always respond the same way so this can't be used to discover which
    // email addresses have accounts.
    if (user?.email) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      // Any previously issued link for this user stops working.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
        },
      })

      try {
        await sendPasswordResetEmail({ to: user.email, name: user.name, token })
      } catch (err) {
        console.error('[forgot-password] email send failed', err)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
