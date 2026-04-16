export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle2, AlertCircle, User, LogOut, ChevronDown } from 'lucide-react'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/utils'
import { InterviewerSignOut } from '@/components/interviewer/InterviewerSignOut'

export default async function InterviewerHubPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const sessionRole = (session.user as any).role as string
  const cookieStore = cookies()
  const previewRole = cookieStore.get('zbhire_preview_role')?.value
  const isAdminPreview = sessionRole === 'ADMIN' && previewRole === 'INTERVIEWER'

  const email = session.user.email

  // Admins previewing as interviewer: show the first available interviewer's data
  let interviewer = email
    ? await prisma.interviewer.findUnique({ where: { email } })
    : null

  if (!interviewer && isAdminPreview) {
    interviewer = await prisma.interviewer.findFirst({ orderBy: { name: 'asc' } })
  }

  if (!interviewer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <InterviewerHeader name={session.user.name ?? session.user.email ?? ''} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Account not linked yet</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your login ({email}) hasn&apos;t been linked to an interviewer profile.
              Ask your recruiter to add you as an interviewer using this exact email address.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()

  const events = await prisma.interviewEvent.findMany({
    where: { interviewerId: interviewer.id },
    include: {
      application: {
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, resumeUrl: true },
          },
          job: { select: { id: true, title: true, department: true } },
        },
      },
      scorecard: { select: { id: true, submittedAt: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const upcoming = events.filter(
    (e) => e.scheduledAt && new Date(e.scheduledAt) >= now
  )
  const past = events
    .filter((e) => !e.scheduledAt || new Date(e.scheduledAt) < now)
    .reverse()
    .slice(0, 15)

  const pendingEval = past.filter((e) => !e.scorecard?.submittedAt)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <InterviewerHeader name={interviewer.name} />

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {events.filter((e) => e.scorecard?.submittedAt).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${pendingEval.length > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
              {pendingEval.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pending eval</p>
          </div>
        </div>

        {/* ── Action Required ── */}
        {pendingEval.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
                Action Required
              </h2>
            </div>
            <div className="space-y-3">
              {pendingEval.map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center">
              <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming interviews scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent (submitted only) ── */}
        {past.filter(e => e.scorecard?.submittedAt).length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Recently Completed
            </h2>
            <div className="space-y-3">
              {past.filter(e => e.scorecard?.submittedAt).map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </section>
        )}

        {/* ── Help FAQ ── */}
        <InterviewerFAQ />
      </div>
    </div>
  )
}

function InterviewerHeader({ name }: { name: string }) {
  return (
    <div className="bg-[#111111] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10">
          <span className="font-black text-sm tracking-tighter">ZB</span>
        </div>
        <div>
          <span className="font-bold text-sm">ZB Hire</span>
          <span className="ml-2 text-white/40 text-xs">Interviewer Portal</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/60 hidden sm:block">{name}</span>
        <InterviewerSignOut />
      </div>
    </div>
  )
}

function EventCard({
  event,
  past = false,
}: {
  event: any
  past?: boolean
}) {
  const { application, scorecard } = event
  const { candidate, job } = application
  const isSubmitted = !!scorecard?.submittedAt
  const typeLabel = INTERVIEW_TYPE_LABELS[event.type as string] ?? event.type

  return (
    <Link
      href={`/interviewer/${event.id}`}
      className="block bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-base font-semibold text-gray-900">
              {candidate.firstName} {candidate.lastName}
            </span>
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Eval submitted
              </span>
            ) : past ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 font-medium">
                <AlertCircle className="w-3 h-3" /> Eval pending
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">{job.title}{job.department ? ` · ${job.department}` : ''}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {event.scheduledAt ? formatDateTime(event.scheduledAt) : 'Time TBD'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {event.durationMins} min
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {typeLabel}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
          {candidate.firstName[0]}{candidate.lastName[0]}
        </div>
      </div>
    </Link>
  )
}

const FAQ_ITEMS = [
  {
    q: 'How do I submit my evaluation?',
    a: 'Click any interview card to open the detail view, then click "Open scorecard." Fill out each section and hit Submit. You can\'t edit it after submitting, so review your notes before confirming.',
  },
  {
    q: 'What if I haven\'t interviewed them yet but the card shows?',
    a: 'You\'ll show up in upcoming interviews as soon as the recruiter logs it. The evaluation button only matters after the interview happens — there\'s no deadline set by the system, but submit as soon as possible while it\'s fresh.',
  },
  {
    q: 'Can I see other interviewers\' evaluations?',
    a: 'No — each evaluation is private. You only see your own assignments and your own submitted scorecards.',
  },
  {
    q: 'Where is the candidate\'s resume?',
    a: 'On the interview detail page, scroll down past the evaluation button. The resume preview loads inline, and there\'s a Download button if you want a copy.',
  },
  {
    q: 'What do the ratings mean (A / B / C)?',
    a: 'A = Strong yes, this person clearly meets or exceeds the bar for this area. B = Leaning yes, meets most of the bar with some gaps. C = No, doesn\'t meet the bar. Be honest — your feedback directly shapes the hiring decision.',
  },
  {
    q: 'I can\'t find my interview — what should I do?',
    a: 'Make sure you\'re logged in with the same email address the recruiter used when they added you as an interviewer. If you\'re still not seeing it, ask the recruiter to confirm which email they used.',
  },
]

function InterviewerFAQ() {
  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Help & FAQ
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {FAQ_ITEMS.map(item => (
          <FAQItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  )
}

// Note: this needs to be a client component for interactivity, but since
// this file is a server component we inline a simple details/summary instead
function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between gap-3 text-sm font-medium text-gray-800 select-none list-none">
        {q}
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
      </summary>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">{a}</p>
    </details>
  )
}
