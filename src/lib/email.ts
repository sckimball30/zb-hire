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
  attachments,
}: {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: nodemailer.SendMailOptions['attachments']
}) {
  const t = getTransporter()
  const info = await t.sendMail({
    from: FROM,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ''),
    attachments,
  })
  console.log('[email] Sent:', info.messageId)
  return info
}

const ROLE_BLURBS: Record<string, string> = {
  ADMIN:          'full access to jobs, candidates, and team settings',
  RECRUITER:      'access to manage jobs, candidates, and the hiring pipeline',
  HIRING_MANAGER: 'access to review candidates and hiring decisions for your roles',
  INTERVIEWER:    'access to your assigned interviews and scorecards',
}

export async function sendInvitationEmail({
  to,
  role,
  invitedByName,
  token,
}: {
  to: string
  role: string
  invitedByName?: string | null
  token: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/auth/register?token=${token}`
  const roleLabel = role.replace('_', ' ').toLowerCase()
  const blurb = ROLE_BLURBS[role] ?? 'access to the hiring platform'

  await sendEmail({
    to,
    subject: `${invitedByName ?? 'Your team'} invited you to join ZB Hire`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
          <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
          <span style="color: rgba(255,255,255,0.4); font-size: 13px; margin-left: 10px;">by ZB Designs</span>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700;">You've been invited to join the team</h2>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            ${invitedByName ? `<strong>${invitedByName}</strong> has` : 'You have been'} invited you to ZB Hire,
            the hiring platform for ZB Designs. You'll join as a
            <strong style="text-transform: capitalize;">${roleLabel}</strong>, which gives you ${blurb}.
          </p>
          <a href="${link}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:12px 24px; border-radius:6px; text-decoration:none;">
            Accept Invitation &rarr;
          </a>
          <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
            This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.
          </p>
          <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
            Button not working? Paste this into your browser:<br>${link}
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string
  name?: string | null
  token: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/auth/reset-password?token=${token}`

  await sendEmail({
    to,
    subject: 'Reset your ZB Hire password',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
          <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi${name ? ` ${name}` : ''},</p>
          <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700;">Reset your password</h2>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Click the button below to choose a new password. This link expires in <strong>1 hour</strong> and can only be used once.
          </p>
          <a href="${link}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:12px 24px; border-radius:6px; text-decoration:none;">
            Reset Password &rarr;
          </a>
          <p style="margin: 28px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email — your password will stay the same.
          </p>
          <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
            Button not working? Paste this into your browser:<br>${link}
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendInterviewAssignmentEmail({
  to,
  interviewerName,
  candidateName,
  jobTitle,
  interviewType,
  scheduledAt,
  location,
  notes,
  eventId,
  icsAttachment,
}: {
  to: string
  interviewerName: string
  candidateName: string
  jobTitle: string
  interviewType: string
  scheduledAt?: string | null
  location?: string | null
  notes?: string | null
  eventId: string
  icsAttachment?: nodemailer.SendMailOptions['attachments'][0]
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/interviewer/${eventId}`

  const timeLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'Time TBD — your recruiter will confirm shortly'

  const detailRows = [
    { label: 'Candidate', value: candidateName },
    { label: 'Role', value: jobTitle },
    { label: 'Type', value: interviewType },
    { label: 'When', value: timeLabel },
    ...(location ? [{ label: 'Where', value: location }] : []),
    ...(notes ? [{ label: 'Notes', value: notes }] : []),
  ]

  try {
    await sendEmail({
      to,
      subject: `Interview assigned: ${candidateName} — ${jobTitle}`,
      attachments: icsAttachment ? [icsAttachment] : undefined,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
            <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
            <span style="color: rgba(255,255,255,0.4); font-size: 13px; margin-left: 10px;">Interviewer Portal</span>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${interviewerName},</p>
            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700;">You've been assigned an interview</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              ${detailRows.map(r => `
                <tr>
                  <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 80px; white-space: nowrap;">${r.label}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; color: #111827;">${r.value}</td>
                </tr>
              `).join('')}
            </table>
            <a href="${link}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:12px 24px; border-radius:6px; text-decoration:none;">
              View Interview &amp; Submit Evaluation →
            </a>
            <p style="margin: 28px 0 0; font-size: 12px; color: #9ca3af;">
              Log in at <a href="${baseUrl}/interviewer" style="color:#4AFFD2;">${baseUrl}/interviewer</a> to see all your upcoming interviews.
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send interview assignment notification:', err)
  }
}

export async function sendInterviewReminderEmail({
  to,
  interviewerName,
  candidateName,
  jobTitle,
  scheduledAt,
  location,
  eventId,
}: {
  to: string
  interviewerName: string
  candidateName: string
  jobTitle: string
  scheduledAt: string
  location?: string | null
  eventId: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/interviewer/${eventId}`
  const timeLabel = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  try {
    await sendEmail({
      to,
      subject: `Reminder: Interview tomorrow with ${candidateName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
            <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${interviewerName},</p>
            <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700;">Interview reminder</h2>
            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
              You have an interview scheduled for <strong>${timeLabel}</strong>.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${candidateName}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${jobTitle}${location ? ` · ${location}` : ''}</p>
            </div>
            <a href="${link}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:12px 24px; border-radius:6px; text-decoration:none;">
              View Interview Details →
            </a>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send interview reminder:', err)
  }
}

export async function sendInterviewUpdateEmail({
  to,
  interviewerName,
  candidateName,
  jobTitle,
  interviewType,
  scheduledAt,
  location,
  notes,
  eventId,
  icsAttachment,
}: {
  to: string
  interviewerName: string
  candidateName: string
  jobTitle: string
  interviewType: string
  scheduledAt?: string | null
  location?: string | null
  notes?: string | null
  eventId: string
  icsAttachment?: nodemailer.SendMailOptions['attachments'][0]
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zb-hires.vercel.app'
  const link = `${baseUrl}/interviewer/${eventId}`

  const timeLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'Time TBD — your recruiter will confirm shortly'

  const detailRows = [
    { label: 'Candidate', value: candidateName },
    { label: 'Role', value: jobTitle },
    { label: 'Type', value: interviewType },
    { label: 'When', value: timeLabel },
    ...(location ? [{ label: 'Where', value: location }] : []),
    ...(notes ? [{ label: 'Notes', value: notes }] : []),
  ]

  try {
    await sendEmail({
      to,
      subject: `Interview updated: ${candidateName} — ${jobTitle}`,
      attachments: icsAttachment ? [icsAttachment] : undefined,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
            <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
            <span style="color: rgba(255,255,255,0.4); font-size: 13px; margin-left: 10px;">Interviewer Portal</span>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${interviewerName},</p>
            <h2 style="margin: 0 0 4px; font-size: 20px; font-weight: 700;">Your interview has been updated</h2>
            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Here are the latest details — your calendar invite has been updated too.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              ${detailRows.map(r => `
                <tr>
                  <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 80px; white-space: nowrap;">${r.label}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; color: #111827;">${r.value}</td>
                </tr>
              `).join('')}
            </table>
            <a href="${link}" style="display:inline-block; background:#4AFFD2; color:#111111; font-weight:700; font-size:14px; padding:12px 24px; border-radius:6px; text-decoration:none;">
              View Interview Details →
            </a>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send interview update notification:', err)
  }
}

export async function sendInterviewCancellationEmail({
  to,
  interviewerName,
  candidateName,
  jobTitle,
  scheduledAt,
  icsAttachment,
}: {
  to: string
  interviewerName: string
  candidateName: string
  jobTitle: string
  scheduledAt?: string | null
  icsAttachment?: nodemailer.SendMailOptions['attachments'][0]
}) {
  const timeLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : null

  try {
    await sendEmail({
      to,
      subject: `Interview cancelled: ${candidateName} — ${jobTitle}`,
      attachments: icsAttachment ? [icsAttachment] : undefined,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <div style="background: #111111; padding: 20px 28px; border-radius: 8px 8px 0 0;">
            <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">ZB Hire</span>
            <span style="color: rgba(255,255,255,0.4); font-size: 13px; margin-left: 10px;">Interviewer Portal</span>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">Hi ${interviewerName},</p>
            <h2 style="margin: 0 0 4px; font-size: 20px; font-weight: 700;">Interview cancelled</h2>
            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
              The interview with <strong>${candidateName}</strong> for <strong>${jobTitle}</strong>${timeLabel ? ` scheduled for ${timeLabel}` : ''} has been cancelled.
              Your calendar invite has been removed.
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send interview cancellation notification:', err)
  }
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
