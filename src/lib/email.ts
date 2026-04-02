import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS are required. Add them in Vercel → Settings → Environment Variables.')
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS via STARTTLS
    auth: { user, pass },
  })

  return transporter
}

const FROM = process.env.EMAIL_FROM ?? 'Wigglitz Hiring <hiring@wigglitz.com>'

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
  const t = getTransporter()
  const info = await t.sendMail({
    from: FROM,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ''),
  })
  console.log('[email] Sent:', info.messageId)
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
