import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOfferPdf } from '@/lib/generateOfferPdf'
import { put } from '@vercel/blob'
import { sendEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const { action, signatureName } = body

    if (!action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'action must be ACCEPT or DECLINE' }, { status: 400 })
    }

    if (action === 'ACCEPT' && (!signatureName || typeof signatureName !== 'string' || signatureName.trim().length <= 2)) {
      return NextResponse.json({ error: 'signatureName is required to accept the offer' }, { status: 400 })
    }

    const existing = await prisma.offer.findUnique({
      where: { token: params.token },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (existing.status !== 'SENT') {
      return NextResponse.json({ error: 'Offer is not in a state that can be responded to' }, { status: 400 })
    }

    if (action === 'DECLINE') {
      const offer = await prisma.offer.update({
        where: { token: params.token },
        data: {
          status: 'DECLINED',
          respondedAt: new Date(),
        },
      })

      await prisma.activityLog.create({
        data: {
          applicationId: existing.applicationId,
          action: `Candidate declined the offer for ${existing.jobTitle}`,
          actorName: 'Candidate',
        },
      })

      return NextResponse.json({ ok: true, offer })
    }

    // ACCEPT flow
    const now = new Date()

    // Fetch full offer data for PDF generation
    const fullOffer = await prisma.offer.findUnique({
      where: { token: params.token },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    })

    if (!fullOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const { candidate, job } = fullOffer.application

    let signedPdfUrl: string | null = null

    // Generate PDF and upload to blob storage
    try {
      const pdfBuffer = await generateOfferPdf({
        candidateFirstName: candidate.firstName,
        candidateLastName: candidate.lastName,
        jobTitle: fullOffer.jobTitle,
        employmentType: (fullOffer.employmentType as 'FULL_TIME' | 'PART_TIME' | null) ?? null,
        salary: fullOffer.salary,
        salaryType: (fullOffer.salaryType as 'ANNUAL' | 'HOURLY'),
        currency: fullOffer.currency,
        bonus: fullOffer.bonus ?? null,
        startDate: fullOffer.startDate,
        notes: fullOffer.notes ?? null,
        signatureName: signatureName.trim(),
        signedAt: now,
        department: job.department ?? null,
        location: job.location ?? null,
      })

      const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
      const blob = await put(
        `offer-letters/${fullOffer.id}-signed.pdf`,
        pdfBuffer,
        {
          access: 'public',
          contentType: 'application/pdf',
          token: blobToken,
        }
      )
      signedPdfUrl = blob.url
    } catch (pdfErr) {
      console.error('[respond] PDF generation/upload failed (non-fatal):', pdfErr)
    }

    // Update offer in DB
    const offer = await prisma.offer.update({
      where: { token: params.token },
      data: {
        status: 'ACCEPTED',
        respondedAt: now,
        candidateSignature: signatureName.trim(),
        signedAt: now,
        ...(signedPdfUrl ? { signedPdfUrl } : {}),
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        applicationId: existing.applicationId,
        action: `Candidate accepted the offer for ${existing.jobTitle}`,
        actorName: 'Candidate',
      },
    })

    // Send email to candidate (non-fatal)
    try {
      if (signedPdfUrl) {
        await sendEmail({
          to: candidate.email,
          subject: `Your Signed Offer Letter — ${fullOffer.jobTitle}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
              <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
                <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Designs</span>
                <span style="color: #4AFFD2; font-size: 13px; margin-left: 10px;">Offer Letter</span>
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
                <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${candidate.firstName},</p>
                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700;">Your signed offer letter is ready</h2>
                <p style="margin: 0 0 24px; color: #374151; font-size: 14px; line-height: 1.6;">
                  Congratulations! You have electronically signed and accepted the offer for <strong>${fullOffer.jobTitle}</strong> at ZB Designs.
                  A copy of your signed offer letter is available for download below.
                </p>
                <a href="${signedPdfUrl}" target="_blank" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:10px 22px; border-radius:6px; text-decoration:none;">
                  Download Signed Offer PDF →
                </a>
                <p style="margin: 28px 0 0; font-size: 12px; color: #9ca3af;">
                  This offer was processed electronically under the ESIGN Act.
                </p>
              </div>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.error('[respond] Email send failed (non-fatal):', emailErr)
    }

    return NextResponse.json({ ok: true, offer })
  } catch (error) {
    console.error('[POST /api/offers/token/:token/respond]', error)
    return NextResponse.json({ error: 'Failed to respond to offer' }, { status: 500 })
  }
}
