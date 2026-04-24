/**
 * Google Calendar integration via a service account with domain-wide delegation.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   e.g. zbhire-calendar@your-project.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY             The private_key value from the downloaded JSON key file.
 *                                  Replace literal newlines with \n when pasting into Vercel.
 *
 * Required Google setup (one-time):
 *   1. console.cloud.google.com → Enable "Google Calendar API"
 *   2. IAM & Admin → Service Accounts → Create → Download JSON key
 *   3. Google Workspace Admin → Security → API Controls → Domain-wide Delegation
 *      → Add Client ID (from JSON) → Scope: https://www.googleapis.com/auth/calendar
 */

import { google } from 'googleapis'

function isConfigured() {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
}

function getCalendarClient(impersonateEmail: string) {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    subject: impersonateEmail, // domain-wide delegation — act as this Workspace user
  })

  return google.calendar({ version: 'v3', auth })
}

export interface CalendarEventInput {
  interviewerEmail: string
  summary: string
  description?: string
  location?: string | null
  startTime: Date
  endTime: Date
}

/**
 * Creates a Google Calendar event on the interviewer's primary calendar.
 * Returns the created event ID (store it to enable future updates/deletes).
 * Returns null if credentials are not configured or the API call fails.
 */
export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  if (!isConfigured()) return null

  try {
    const calendar = getCalendarClient(input.interviewerEmail)
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: input.summary,
        description: input.description,
        location: input.location ?? undefined,
        start: { dateTime: input.startTime.toISOString(), timeZone: 'UTC' },
        end:   { dateTime: input.endTime.toISOString(),   timeZone: 'UTC' },
      },
    })
    console.log('[gcal] Event created:', res.data.id)
    return res.data.id ?? null
  } catch (err: any) {
    console.error('[gcal] createCalendarEvent failed:', err?.message ?? err)
    return null
  }
}

/**
 * Updates an existing Google Calendar event.
 * Safe no-op if googleEventId is null or credentials are not configured.
 */
export async function updateCalendarEvent(
  interviewerEmail: string,
  googleEventId: string,
  input: Partial<Omit<CalendarEventInput, 'interviewerEmail'>>
): Promise<void> {
  if (!isConfigured() || !googleEventId) return

  try {
    const calendar = getCalendarClient(interviewerEmail)
    const patch: Record<string, any> = {}
    if (input.summary)   patch.summary  = input.summary
    if (input.description !== undefined) patch.description = input.description
    if (input.location !== undefined)    patch.location    = input.location ?? ''
    if (input.startTime) patch.start = { dateTime: input.startTime.toISOString(), timeZone: 'UTC' }
    if (input.endTime)   patch.end   = { dateTime: input.endTime.toISOString(),   timeZone: 'UTC' }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: patch,
    })
    console.log('[gcal] Event updated:', googleEventId)
  } catch (err: any) {
    console.error('[gcal] updateCalendarEvent failed:', err?.message ?? err)
  }
}

/**
 * Deletes a Google Calendar event.
 * Safe no-op if googleEventId is null or credentials are not configured.
 */
export async function deleteCalendarEvent(
  interviewerEmail: string,
  googleEventId: string
): Promise<void> {
  if (!isConfigured() || !googleEventId) return

  try {
    const calendar = getCalendarClient(interviewerEmail)
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    })
    console.log('[gcal] Event deleted:', googleEventId)
  } catch (err: any) {
    // 410 Gone = already deleted; not an error worth surfacing
    if (err?.code !== 410) {
      console.error('[gcal] deleteCalendarEvent failed:', err?.message ?? err)
    }
  }
}

/** Build a human-readable event description for the calendar event. */
export function buildEventDescription({
  candidateName,
  jobTitle,
  interviewType,
  scorecardUrl,
  notes,
}: {
  candidateName: string
  jobTitle: string
  interviewType: string
  scorecardUrl: string
  notes?: string | null
}): string {
  const lines = [
    `Candidate: ${candidateName}`,
    `Role: ${jobTitle}`,
    `Interview type: ${interviewType}`,
    ``,
    `📋 Scorecard: ${scorecardUrl}`,
  ]
  if (notes?.trim()) {
    lines.push(``, `Notes: ${notes.trim()}`)
  }
  return lines.join('\n')
}
