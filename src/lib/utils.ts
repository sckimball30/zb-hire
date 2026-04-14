import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function fullName(first: string, last: string) {
  return `${first} ${last}`
}

export function initials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase()
}

/**
 * Returns true if the given date is within the last 12 hours (used for "New Applicant" badge).
 */
export function isNewApplicant(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return Date.now() - new Date(date).getTime() < 12 * 60 * 60 * 1000
}

/**
 * Strip quoted email reply chains from a message body.
 * Removes "On [date] ... wrote:" blocks and trailing "> " quoted lines
 * so inbound replies display cleanly as chat messages.
 */
export function stripEmailQuote(body: string): string {
  if (!body) return body

  // Match Gmail-style quote header: "On [date] [name] <email> wrote:"
  // Handles both \n\n and \r\n\r\n line endings
  const quoteHeaderMatch = body.match(/(\r?\n){1,2}On .{5,300}wrote:\s*(\r?\n|$)/s)
  if (quoteHeaderMatch?.index !== undefined) {
    body = body.slice(0, quoteHeaderMatch.index)
  }

  // Strip any trailing lines that are quoted (start with ">") or blank
  const lines = body.split('\n')
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim()
    if (last === '' || last.startsWith('>')) {
      lines.pop()
    } else {
      break
    }
  }

  return lines.join('\n').trim()
}
