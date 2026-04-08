import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const templates = [
  {
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
    name: 'Rejection — Post On-Site',
    subject: 'Your Application to Wigglitz — {{Job Title}}',
    body: `Hi {{First Name}},

I wanted to personally reach out and thank you for the time and energy you invested in our process for the {{Job Title}} role. Getting to the onsite stage is a real accomplishment and we don't take lightly the commitment that represents.

After thoughtful discussion, we've decided to move forward with another candidate. This was a close call — the team was genuinely impressed by {{Specific Positive}}, and we want you to know this decision was not easy.

We hope our paths cross again. We'll keep your information on file and reach out if we think there's a future opportunity worth exploring.

Thank you again — we're rooting for you.

Hiring Team — Wigglitz`,
  },
]

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

  return NextResponse.json({ ok: true, results })
}
