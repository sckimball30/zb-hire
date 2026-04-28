/**
 * Generates RFC 5545-compliant iCalendar (.ics) content for interview events.
 *
 * METHOD:REQUEST  → new event or update (recipient sees "Add to Calendar" in Gmail)
 * METHOD:CANCEL   → cancellation (removes the event from the recipient's calendar)
 *
 * The UID must stay the same across create / update / cancel for calendar clients
 * to recognise them as the same event.
 */

function fmt(d: Date): string {
  // Format: 20260428T140000Z
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

export interface ICSInput {
  uid: string
  summary: string
  description?: string | null
  location?: string | null
  startTime: Date
  endTime: Date
  organizerEmail: string
  organizerName: string
  attendeeEmail: string
  attendeeName: string
  method?: 'REQUEST' | 'CANCEL'
  sequence?: number
}

export function generateICS({
  uid,
  summary,
  description,
  location,
  startTime,
  endTime,
  organizerEmail,
  organizerName,
  attendeeEmail,
  attendeeName,
  method = 'REQUEST',
  sequence = 0,
}: ICSInput): string {
  const now = fmt(new Date())
  const status = method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZB Hire//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmt(startTime)}`,
    `DTEND:${fmt(endTime)}`,
    `SUMMARY:${esc(summary)}`,
    description ? `DESCRIPTION:${esc(description)}` : null,
    location ? `LOCATION:${esc(location)}` : null,
    `ORGANIZER;CN="${esc(organizerName)}":mailto:${organizerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;RSVP=TRUE;CN="${esc(attendeeName)}":mailto:${attendeeEmail}`,
    `SEQUENCE:${sequence}`,
    `STATUS:${status}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.filter(Boolean).join('\r\n')
}

/** Returns a nodemailer-compatible attachment object ready to add to sendMail() */
export function icsAttachment(content: string, method: 'REQUEST' | 'CANCEL' = 'REQUEST') {
  return {
    filename: 'invite.ics',
    content,
    contentType: `text/calendar; method=${method}; charset=UTF-8`,
  }
}
