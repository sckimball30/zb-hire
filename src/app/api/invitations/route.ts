import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
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

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link = `${baseUrl}/auth/register?token=${invitation.token}`

  try {
    await sendEmail({
      to: email,
      subject: "You've been invited to join ATS",
      html: `
        <p>You've been invited to join the ATS platform.</p>
        <p><a href="${link}">Click here to accept your invitation</a></p>
        <p>This link expires in 7 days.</p>
        <p style="color:#888;font-size:12px">Or copy this URL: ${link}</p>
      `,
    })
  } catch (err) {
    console.error('[invite email]', err)
  }

  return NextResponse.json({ ok: true, link })
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result

  const { id } = await req.json()
  await prisma.invitation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
