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
