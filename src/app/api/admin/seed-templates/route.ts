import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const templates = [
  // ── Outreach ──────────────────────────────────────────────────────────────
  {
    category: 'Outreach',
    name: 'Phone Screen Request',
    subject: "We'd love to connect — {{Job Title}} at Wigglitz",
    body: `Hi {{First Name}},

Thank you for applying to the {{Job Title}} role at Wigglitz — we've reviewed your application and we're excited to learn more about you!

We'd love to set up a quick 20–30 minute introductory call to tell you more about the role and the team, and to hear about your background and what you're looking for.

Feel free to grab a time that works for you directly on our calendar:

{{Calendly Link}}

Looking forward to connecting!

Hiring Team — Wigglitz`,
  },
  {
    category: 'Outreach',
    name: 'Phone Screen Follow-Up (No Response)',
    subject: 'Still Interested? — {{Job Title}} at Wigglitz',
    body: `Hi {{First Name}},

Just wanted to follow up on my note from a few days ago about the {{Job Title}} role at Wigglitz. I know things get busy and emails get buried, so I didn't want this to fall through the cracks.

We're still excited about your background and would love to connect. If you're still interested, go ahead and grab a time using the link below — it's just a quick 20–30 minute introductory call.

{{Calendly Link}}

If your situation has changed or the timing isn't right, no worries at all — just let me know and I'll update things on our end.

Either way, thanks for your time and we wish you the best!

Hiring Team — Wigglitz`,
  },

  // ── Interviews ────────────────────────────────────────────────────────────
  {
    category: 'Interviews',
    name: 'Video Call Interview Invitation',
    subject: "You're Invited to a Video Interview — {{Job Title}}",
    body: `Hi {{First Name}},

Great news — we'd love to move you forward in our process for the {{Job Title}} role!

We'd like to set up a video call with {{Interviewer Name}}, {{Interviewer Title}}. The conversation will run about {{Duration}} and you can expect it to cover your background and experience as it relates to this role.

Go ahead and book a time that works for you using {{Interviewer Name}}'s scheduling link below — a video call link will be included in your confirmation:

{{Calendly Link}}

Make sure you're in a quiet spot with a good connection. Looking forward to it — reach out if you have any questions before then!

Hiring Team — Wigglitz`,
  },
  {
    category: 'Interviews',
    name: 'Interview Invitation (with Calendly)',
    subject: 'Moving Forward — {{Job Title}} Interview',
    body: `Hi {{First Name}},

Great news — we'd love to move you forward in our process for the {{Job Title}} role!

Your next conversation will be with {{Interviewer Name}}, {{Interviewer Title}}. This will be a {{Duration}} interview focused on {{Focus Area}}.

Go ahead and book a time that works for you using the link below:

{{Calendly Link}}

Excited to keep the momentum going — let us know if you have any questions!

Hiring Team — Wigglitz`,
  },
  {
    category: 'Interviews',
    name: 'Interview Invitation (Request Availability)',
    subject: 'Moving Forward — {{Job Title}} Interview',
    body: `Hi {{First Name}},

Exciting news — we'd love to move you forward for the {{Job Title}} role!

Your next conversation will be with {{Interviewer Name}}, {{Interviewer Title}}. This will be a {{Duration}} interview focused on {{Focus Area}}.

Could you share a few windows of availability over the next {{Timeframe}}? Please include the time zone you're in and we'll get something confirmed quickly.

Can't wait to keep things moving — reach out with any questions!

Hiring Team — Wigglitz`,
  },
  {
    category: 'Interviews',
    name: 'On-Site Interview Invitation',
    subject: "You're Invited to an On-Site Interview — {{Job Title}}",
    body: `Hi {{First Name}},

We've really enjoyed getting to know you throughout this process and we're excited to invite you to an onsite interview for the {{Job Title}} role!

Here's what to expect on the day:

• Location: {{Office Address}}
• Format: {{Interview Format}}
• Approximate duration: {{Duration}}
• You'll meet: {{Interviewers / Teams}}

To get this scheduled, could you share your availability over the next {{Timeframe}}? Please include your time zone and any hard constraints — we'll aim to confirm within {{Confirmation Window}}.

In the meantime, feel free to reach out with any questions — we want to make sure you feel fully prepared and excited for the day.

Hiring Team — Wigglitz`,
  },
  {
    category: 'Interviews',
    name: 'Interview Confirmation / Reminder',
    subject: '{{Interview Type}} Confirmed — {{Job Title}} at Wigglitz',
    body: `Hi {{First Name}},

Just confirming your {{Interview Type}} for the {{Job Title}} role. Here are the details:

Date: {{Interview Date}}
Time: {{Interview Time}} {{Time Zone}}
Format: {{Video Call / Phone / In-Person}}
{{If video: Meeting link: {{Meeting Link}}}}
{{If in-person: Address: {{Office Address}}, Ask for {{Contact Name}} at the front desk}}
Who you'll be meeting with: {{Interviewer Name(s) and Title(s)}}

The conversation will run about {{Duration}}. No need to prepare anything specific — just come ready to talk through your experience and ask whatever questions you have about the role and the team.

If anything comes up and you need to reschedule, just reply here or reach out directly and we'll get you sorted.

Looking forward to it.

Hiring Team — Wigglitz`,
  },

  // ── Offers ────────────────────────────────────────────────────────────────
  {
    category: 'Offers',
    name: 'Verbal Offer',
    subject: 'Great News — Your Offer for {{Job Title}} at Wigglitz',
    body: `Hi {{First Name}},

It was great talking with you today. As we discussed, we'd love to officially welcome you to the team as our {{Job Title}}.

Here's a quick recap of what we covered:

Start date: {{Start Date}}
Compensation: {{Salary/Rate}}
{{Other Key Terms, e.g., bonus, equity, location/remote status}}

You'll receive your formal offer letter at this email address within {{X business days}}. Please take the time you need to review everything, and don't hesitate to reach out if you have questions before then.

We're really excited about this and hope you are too. Looking forward to making it official.

Hiring Team — Wigglitz`,
  },
  {
    category: 'Offers',
    name: 'Offer Letter',
    subject: 'Your Offer of Employment — {{Job Title}} at Wigglitz',
    body: `{{Date}}

{{First Name}} {{Last Name}}
{{Candidate Address}}

Dear {{First Name}},

We are thrilled to offer you the position of {{Job Title}} at Wigglitz. On behalf of the entire team, we can't wait to have you join us.

POSITION & REPORTING
Title: {{Job Title}}
Department: {{Department}}
Reports to: {{Manager Name}}, {{Manager Title}}
Start Date: {{Start Date}}
Work Location: {{Office / Remote / Hybrid details}}

COMPENSATION
Base Salary: \${{Annual Salary}} per year, paid {{bi-weekly / semi-monthly}}, subject to applicable taxes and withholdings.
{{Bonus (if applicable): You will be eligible for a discretionary annual bonus of up to {{Bonus % or Amount}}, based on individual and company performance.}}
{{Equity (if applicable): Subject to approval by the Board of Directors, you will be granted {{Equity Amount}} of {{Stock Options / RSUs}}, vesting over {{Vesting Schedule}} with a {{Cliff}} cliff.}}

BENEFITS
You will be eligible to participate in Wigglitz's employee benefits program, which currently includes {{health, dental, vision, 401(k), PTO, etc.}}. Full details will be provided separately by our HR team.

EMPLOYMENT STATUS
This is a {{full-time / part-time}} position. Your employment with Wigglitz is at-will, meaning that either you or the company may terminate the employment relationship at any time and for any reason, with or without cause or advance notice.

CONFIDENTIALITY & AGREEMENTS
As a condition of your employment, you will be asked to sign Wigglitz's standard Employee Confidentiality and Intellectual Property Agreement prior to your start date.

ACCEPTING THIS OFFER
This offer will remain open until {{Offer Expiration Date}}. To accept, please sign below and return a copy to {{HR Contact Name}} at {{HR Contact Email}}.

If you have any questions at all, please don't hesitate to reach out. We are genuinely excited about what you'll bring to the team and look forward to welcoming you aboard.

Sincerely,

{{Hiring Manager Name}}
{{Hiring Manager Title}}
Wigglitz


─────────────────────────────────────────────────────
ACCEPTANCE

I, {{First Name}} {{Last Name}}, accept the offer of employment described in this letter and agree to the terms and conditions stated herein.

Signature: ___________________________   Date: ____________`,
  },
  {
    category: 'Offers',
    name: 'Offer Letter Follow-Up',
    subject: 'Following Up — Offer Letter for {{Job Title}}',
    body: `Hi {{First Name}},

Just checking in on the offer letter we sent over for the {{Job Title}} role. We know it's a big decision and we want to make sure you have everything you need.

If you have any questions about the terms, the start date, or anything else, please don't hesitate to reach out. We're happy to talk through it.

If you're ready to move forward, you can sign and return the letter at your earliest convenience. Our target start date is {{Start Date}}, so ideally we'd love to hear back by {{Response Deadline}}.

Looking forward to hearing from you.

Hiring Team — Wigglitz`,
  },

  // ── Rejections ────────────────────────────────────────────────────────────
  {
    category: 'Rejections',
    name: 'Rejection — Pre-Screening (Resume Review)',
    subject: 'Your Application to Wigglitz — {{Job Title}}',
    body: `Hi {{First Name}},

Thank you for your interest in the {{Job Title}} role at Wigglitz and for taking the time to apply.

After reviewing your application, we've decided to move forward with candidates whose background more closely matches what we're looking for at this time. We know this isn't the news you were hoping for, and we genuinely appreciate you thinking of us.

We're always growing, and we'll keep your information on file in case the right opportunity comes along down the road.

Thanks again, and we wish you the very best in your search.

Hiring Team — Wigglitz`,
  },
  {
    category: 'Rejections',
    name: 'Rejection — Post-Screening (Pre On-Site)',
    subject: 'Your Application to Wigglitz — {{Job Title}}',
    body: `Hi {{First Name}},

Thank you so much for the time you've invested in our process for the {{Job Title}} role — it has been a pleasure getting to know you.

After careful consideration, we've decided not to move forward to the next stage at this time. This was not an easy decision — {{Specific Positive}}, and that genuinely stood out to us.

We'd love to stay connected. We'll keep your information on file and will reach out if we think a future role could be a strong match.

Thank you again for your time and energy — we're rooting for you.

Hiring Team — Wigglitz`,
  },
  {
    category: 'Rejections',
    name: 'Rejection — Post Phone Screen',
    subject: 'Your Application to Wigglitz — {{Job Title}}',
    body: `Hi {{First Name}},

Thank you so much for taking the time to speak with us and for your interest in the {{Job Title}} role at Wigglitz.

After careful consideration, we've decided to move forward with other candidates whose experience more closely aligns with what we're looking for at this stage. This was a genuinely difficult decision — we were impressed by {{Specific Positive}}.

We'd love to stay in touch. If a role opens up that feels like a stronger match, we'll be sure to reach out.

Thanks again for your time and enthusiasm — we wish you all the best in your search.

Hiring Team — Wigglitz`,
  },
  {
    category: 'Rejections',
    name: 'Rejection — Post On-Site',
    subject: 'Your Application to Wigglitz — {{Job Title}}',
    body: `Hi {{First Name}},

I wanted to personally reach out and thank you for the time and energy you invested in our process for the {{Job Title}} role. Getting to the onsite stage is a real accomplishment and we don't take lightly the commitment that represents.

After thoughtful discussion, we've decided to move forward with another candidate. This was a close call — the team was genuinely impressed by {{Specific Positive}}, and we want you to know this decision was not easy.

We hope our paths cross again. We'll keep your information on file and reach out if we think there's a future opportunity worth exploring.

Thank you again — we're rooting for you.

Hiring Team — Wigglitz`,
  },
  {
    category: 'Rejections',
    name: 'Keeping You in Mind (Silver Medalist)',
    subject: 'Staying in Touch — {{Job Title}} at Wigglitz',
    body: `Hi {{First Name}},

I wanted to reach out personally to let you know that we've moved forward with another candidate for the {{Job Title}} role. This was a genuinely tough call — you stood out throughout the process and we have a lot of respect for your background.

We don't want to lose touch. If the right role opens up at Wigglitz, you'll be one of the first people we think of, and we'd love to reconnect when that happens.

Thanks again for the time you invested in getting to know us. We hope to work together someday.

Hiring Team — Wigglitz`,
  },

  // ── General ───────────────────────────────────────────────────────────────
  {
    category: 'General',
    name: 'Application Received',
    subject: 'We Got Your Application — {{Job Title}} at Wigglitz',
    body: `Hi {{First Name}},

Thanks for applying for the {{Job Title}} role at Wigglitz. We received your application and our team will be reviewing it shortly.

We go through every application carefully, so we appreciate your patience. If your background looks like a strong match, someone from our team will be in touch to set up a call.

Either way, we'll follow up with you once we've had a chance to review. Thanks again for your interest in Wigglitz.

Hiring Team — Wigglitz`,
  },
  {
    category: 'General',
    name: 'Reference Check Request',
    subject: 'Reference Request — {{Candidate Full Name}}, {{Job Title}} at Wigglitz',
    body: `Hi {{Reference First Name}},

My name is {{Your Name}} and I'm on the talent team at Wigglitz. {{Candidate First Name}} listed you as a reference as part of their application for our {{Job Title}} opening, and I was hoping to connect with you briefly.

If you're open to it, I'd love to schedule a 10-15 minute call at your convenience. You can grab a time using the link below, or feel free to reply with what works for you.

{{Scheduling Link or Availability}}

If a call doesn't work, I'm also happy to send over a few questions by email — just let me know what you'd prefer.

Thanks so much for your time. We really appreciate it.

Hiring Team — Wigglitz`,
  },
  {
    category: 'General',
    name: 'Candidate Withdrawal Acknowledgment',
    subject: 'Re: {{Job Title}} at Wigglitz',
    body: `Hi {{First Name}},

Thanks for letting us know, and no worries at all. We completely understand that circumstances change and that you have to do what's right for you.

We genuinely enjoyed getting to know you throughout this process, and we think you'd be a great fit for the right opportunity. We'll keep your information on file and hope our paths cross again down the road.

Wishing you all the best with whatever comes next.

Hiring Team — Wigglitz`,
  },
  {
    category: 'General',
    name: 'Pre-Onboarding / Welcome to the Team',
    subject: 'Welcome to Wigglitz, {{First Name}}!',
    body: `Hi {{First Name}},

We are so excited to have you joining the team. Your first day is {{Start Date}} and we want to make sure you feel set up and ready to go.

{{HR to insert: paperwork/I-9 instructions, equipment details, office/remote logistics, point of contact for day one questions, etc.}}

In the meantime, don't hesitate to reach out if anything comes up. We can't wait to get started.

Hiring Team — Wigglitz`,
  },
]

// Variables that should never appear in rejection emails
const SCHEDULING_VARS = [
  '{{Calendly Link}}', '{{calendlyLink}}',
  '{{Interviewer Name}}', '{{Interviewer Title}}',
  '{{Duration}}', '{{Focus Area}}', '{{Timeframe}}',
  '{{Confirmation Window}}', '{{Interview Format}}',
  '{{Office Address}}', '{{Interviewers / Teams}}',
]

function stripSchedulingVars(text: string): string {
  let out = text
  for (const v of SCHEDULING_VARS) {
    out = out.split(v).join('')
  }
  out = out.replace(/\n{3,}/g, '\n\n').trim()
  return out
}

export async function POST() {
  const results: string[] = []

  for (const t of templates) {
    const existing = await prisma.messageTemplate.findFirst({ where: { name: t.name } })
    if (existing) {
      await prisma.messageTemplate.update({ where: { id: existing.id }, data: t })
      results.push(`Updated: ${t.name}`)
    } else {
      await prisma.messageTemplate.create({ data: t })
      results.push(`Inserted: ${t.name}`)
    }
  }

  // Clean scheduling vars out of any rejection templates in the DB
  const rejectTemplates = await prisma.messageTemplate.findMany({
    where: { name: { contains: 'reject', mode: 'insensitive' } },
  })
  for (const t of rejectTemplates) {
    const cleanSubject = stripSchedulingVars(t.subject)
    const cleanBody    = stripSchedulingVars(t.body)
    if (cleanSubject !== t.subject || cleanBody !== t.body) {
      await prisma.messageTemplate.update({
        where: { id: t.id },
        data: { subject: cleanSubject, body: cleanBody },
      })
      results.push(`Cleaned scheduling vars from: ${t.name}`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
