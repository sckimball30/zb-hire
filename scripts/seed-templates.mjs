// Seed default message templates into the database.
// Uses the Prisma client so it works with any DB provider configured in .env
// Run: node scripts/seed-templates.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  {
    name: 'Phone Screen Request',
    subject: 'Quick Chat? — {{jobTitle}} at Wigglitz',
    body: `Hi {{firstName}},

Thank you for applying for the {{jobTitle}} position at Wigglitz! We've reviewed your application and would love to connect for a quick 20–30 minute phone call to learn more about your background and share more about the role.

Are you available in the next few days? Please reply with a few times that work for you, or book directly using this link: [Your Calendly Link]

Looking forward to speaking with you!

{{recruiterName}}
Wigglitz Recruiting Team`,
  },
  {
    name: 'Interview Invitation',
    subject: 'Interview Invitation — {{jobTitle}} at Wigglitz',
    body: `Hi {{firstName}},

We were impressed by your background and would love to invite you to interview for the {{jobTitle}} position at Wigglitz!

We'd like to schedule time with our team. Please use the link below to select a time that works best for you: [Interview Scheduling Link]

If you have any questions in the meantime, don't hesitate to reach out.

Looking forward to speaking with you!

{{recruiterName}}
Wigglitz Recruiting Team`,
  },
  {
    name: 'On-Site Interview Invitation',
    subject: 'On-Site Interview — {{jobTitle}} at Wigglitz',
    body: `Hi {{firstName}},

We've really enjoyed getting to know you throughout this process and would like to invite you to our office for an on-site interview for the {{jobTitle}} position!

Details:
📍 Location: [Office Address]
📅 Date/Time: [Date and Time]
⏱ Duration: Approximately [X] hours

You'll meet members of our team and get a feel for our culture. Please confirm your availability by replying to this email, or let us know if you need to reschedule.

We're excited to meet you in person!

{{recruiterName}}
Wigglitz Recruiting Team`,
  },
  {
    name: 'Rejection',
    subject: 'Your Application to Wigglitz — {{jobTitle}}',
    body: `Hi {{firstName}},

Thank you for taking the time to apply for the {{jobTitle}} position at Wigglitz and for your interest in joining our team. We appreciate the effort you put into the process.

After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs. This was a difficult decision, and we were genuinely impressed by the candidates we spoke with.

We encourage you to keep an eye on our openings, as we hope to have other opportunities in the future that may be a great fit. We wish you all the best in your search.

Thank you again for your time and interest in Wigglitz.

{{recruiterName}}
Wigglitz Recruiting Team`,
  },
]

async function main() {
  let inserted = 0
  let skipped = 0

  for (const t of templates) {
    const existing = await prisma.messageTemplate.findFirst({ where: { name: t.name } })
    if (existing) {
      console.log(`[skip] "${t.name}" already exists`)
      skipped++
    } else {
      await prisma.messageTemplate.create({ data: t })
      console.log(`[insert] "${t.name}"`)
      inserted++
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
