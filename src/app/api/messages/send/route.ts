import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { candidateId, subject, body, templateId } = await req.json()

  if (!candidateId || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'candidateId, subject and body are required' }, { status: 400 })
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  try {
    await sendEmail({
      to: candidate.email,
      subject: subject.trim(),
      html: body.replace(/\n/g, '<br>'),
      text: body,
    })
  } catch (err) {
    console.error('[send email]', err)
    return NextResponse.json({ error: 'Failed to send email. Check SMTP settings.' }, { status: 500 })
  }

  await prisma.messageLog.create({
    data: {
      candidateId,
      templateId: templateId || null,
      subject: subject.trim(),
      body: body.trim(),
      sentById: (session?.user as any)?.id ?? null,
      sentByName: session?.user?.name ?? session?.user?.email ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}
