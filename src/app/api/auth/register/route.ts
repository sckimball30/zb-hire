import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, email, password, token } = await req.json()

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use.' }, { status: 400 })
  }

  // If a token is provided, validate the invitation
  let role: 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'HIRING_MANAGER' = 'RECRUITER'
  if (token) {
    const invitation = await prisma.invitation.findUnique({ where: { token } })
    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation is invalid or expired.' }, { status: 400 })
    }
    if (invitation.email !== email) {
      return NextResponse.json({ error: 'Email does not match invitation.' }, { status: 400 })
    }
    role = invitation.role as 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'HIRING_MANAGER'
    await prisma.invitation.update({ where: { token }, data: { acceptedAt: new Date() } })
  } else {
    // First user ever becomes admin
    const count = await prisma.user.count()
    if (count === 0) role = 'ADMIN'
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, password: hashed, role } })

  // Auto-create an Interviewer profile for interviewers and hiring managers
  // so they show up in the interviewers list and can have a Calendly link added
  if (role === 'INTERVIEWER' || role === 'HIRING_MANAGER') {
    await prisma.interviewer.upsert({
      where: { email },
      update: { name: name || email },
      create: { name: name || email, email },
    })
  }

  return NextResponse.json({ ok: true })
}
