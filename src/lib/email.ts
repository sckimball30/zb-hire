import nodemailer from 'nodemailer'

// Configure via env vars. Falls back to Ethereal (test) if not set.
let transporter: nodemailer.Transporter | null = null

export async function getTransporter() {
  if (transporter) return transporter

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Ethereal catch-all for dev/testing — logs preview URL to console
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    console.log('[email] Using Ethereal test account:', testAccount.user)
  }

  return transporter
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const t = await getTransporter()
  const info = await t.sendMail({
    from: process.env.EMAIL_FROM ?? '"ATS" <noreply@ats.local>',
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ''),
  })

  // Log preview URL in dev (Ethereal only)
  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) console.log('[email] Preview URL:', preview)

  return info
}

export async function sendNewApplicationEmail({
  to,
  recruiterName,
  candidateName,
  jobTitle,
  jobId,
}: {
  to: string
  recruiterName: string
  candidateName: string
  jobTitle: string
  jobId: string
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${appUrl}/jobs/${jobId}`

  try {
    await sendEmail({
      to,
      subject: `New Application: ${candidateName} applied for ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
            <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${recruiterName},</p>
            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700;">New application received</h2>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${candidateName}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Applied for: <strong>${jobTitle}</strong></p>
            </div>
            <a href="${link}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:10px 22px; border-radius:6px; text-decoration:none;">
              View Application →
            </a>
            <p style="margin: 28px 0 0; font-size: 12px; color: #9ca3af;">
              You're receiving this because you're the main recruiter for this role.
              To stop these notifications, toggle email alerts off in ZB Hire.
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send new application notification:', err)
  }
}
