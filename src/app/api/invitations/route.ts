import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { invitedBy: { select: { name: true, email: true } } },
  })
  return NextResponse.json(invitations)
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { email, role } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const invitation = await prisma.invitation.create({
    data: {
      email,
      role: role ?? 'RECRUITER',
      invitedById: admin.id,
      expiresAt,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/auth/register?token=${invitation.token}`

  // The invitation record is valid whether or not the email goes out, so a send
  // failure isn't fatal — but it must be reported, otherwise the UI claims the
  // invite was delivered when nobody received anything.
  let emailSent = true
  let emailError: string | undefined
  try {
    await sendInvitationEmail({
      to: email,
      role: invitation.role,
      invitedByName: admin.name ?? admin.email,
      token: invitation.token,
    })
  } catch (err) {
    emailSent = false
    emailError = err instanceof Error ? err.message : 'Unknown error'
    console.error('[invite email]', err)
  }

  return NextResponse.json({ ok: true, link, emailSent, emailError })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Generate a fresh token and extend expiry by 7 days
  const { randomUUID } = await import('crypto')
  const invitation = await prisma.invitation.update({
    where: { id },
    data: {
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/auth/register?token=${invitation.token}`

  let emailSent = true
  let emailError: string | undefined
  try {
    await sendInvitationEmail({
      to: invitation.email,
      role: invitation.role,
      invitedByName: admin.name ?? admin.email,
      token: invitation.token,
    })
  } catch (err) {
    emailSent = false
    emailError = err instanceof Error ? err.message : 'Unknown error'
    console.error('[resend invite email]', err)
  }

  return NextResponse.json({ ok: true, link, emailSent, emailError })
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const { id } = await req.json()
  await prisma.invitation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
