import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(
  _request: Request,
  { params }: { params: { offerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.offer.findUnique({
      where: { id: params.offerId },
      include: {
        application: {
          include: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const offer = await prisma.offer.update({
      where: { id: params.offerId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Send email to candidate
    const candidate = existing.application.candidate
    const jobTitle = existing.application.job.title
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
    const offerLink = `${baseUrl}/offers/${existing.token}`

    try {
      await sendEmail({
        to: candidate.email,
        subject: `Your Offer Letter — ${jobTitle} at Wigglitz`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
            <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
              <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${candidate.firstName},</p>
              <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700;">Congratulations! 🎉</h2>
              <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                We're excited to extend an offer for the <strong>${jobTitle}</strong> position at Wigglitz.
                Please review your offer letter and let us know if you have any questions.
              </p>
              <a href="${offerLink}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:15px; padding:12px 28px; border-radius:8px; text-decoration:none; margin-bottom:20px;">
                View & Sign Offer Letter →
              </a>
              ${existing.expiresAt ? `<p style="margin: 0 0 20px; font-size: 13px; color: #6b7280;">This offer expires on <strong>${new Date(existing.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>` : ''}
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                If you have any questions, reply to this email or reach out to us directly.
                We look forward to welcoming you to the team!
              </p>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[offer send] Failed to email candidate:', emailErr)
      // Don't fail the whole request — offer is still marked sent
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        applicationId: existing.applicationId,
        action: `Offer letter emailed to ${candidate.firstName} ${candidate.lastName}`,
        actorName: session.user?.name || 'User',
      },
    })

    return NextResponse.json({ ok: true, offer })
  } catch (error) {
    console.error('[POST /api/offers/:id/send]', error)
    return NextResponse.json({ error: 'Failed to send offer' }, { status: 500 })
  }
}
