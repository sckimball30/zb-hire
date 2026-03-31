import { prisma } from './prisma'
import { sendEmail } from './email'

function replaceMergeFields(text: string, data: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(key, value)
  }
  return result
}

export async function sendApplicationConfirmation({
  candidateEmail,
  firstName,
  fullName,
  jobTitle,
  department,
}: {
  candidateEmail: string
  firstName: string
  fullName: string
  jobTitle: string
  department?: string | null
}) {
  try {
    const automation = await prisma.emailAutomation.findUnique({
      where: { type: 'APPLICATION_CONFIRMATION' },
    })
    if (!automation || !automation.enabled) return

    const data: Record<string, string> = {
      '{{firstName}}': firstName,
      '{{fullName}}': fullName,
      '{{jobTitle}}': jobTitle,
      '{{department}}': department ?? '',
      '{{companyName}}': 'Wigglitz',
    }

    const subject = replaceMergeFields(automation.subject, data)
    const body = replaceMergeFields(automation.body, data)

    await sendEmail({ to: candidateEmail, subject, text: body, html: body.replace(/\n/g, '<br>') })
  } catch (err) {
    console.error('Failed to send application confirmation:', err)
  }
}
