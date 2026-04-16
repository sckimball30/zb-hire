export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronDown, Clapperboard } from 'lucide-react'

// ── Demo data — never touches the real database ───────────────────────────────

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(10, 0, 0, 0)
  return d
}

const DEMO_EVENTS = [
  {
    id: 'demo-pending',
    candidateFirst: 'Jordan',
    candidateLast: 'Lee',
    jobTitle: 'Sales Representative',
    department: 'Sales',
    type: 'BEHAVIORAL',
    scheduledAt: daysFromNow(-1),
    durationMins: 45,
    location: 'Zoom',
    past: true,
    evalPending: true,
    evalSubmitted: false,
  },
  {
    id: 'demo-upcoming-1',
    candidateFirst: 'Alex',
    candidateLast: 'Rivera',
    jobTitle: 'Marketing Manager',
    department: 'Marketing',
    type: 'PHONE_SCREEN',
    scheduledAt: daysFromNow(2),
    durationMins: 30,
    location: 'Phone',
    past: false,
    evalPending: false,
    evalSubmitted: false,
  },
  {
    id: 'demo-upcoming-2',
    candidateFirst: 'Casey',
    candidateLast: 'Morgan',
    jobTitle: 'Sales Representative',
    department: 'Sales',
    type: 'BEHAVIORAL',
    scheduledAt: daysFromNow(5),
    durationMins: 45,
    location: 'Zoom',
    past: false,
    evalPending: false,
    evalSubmitted: false,
  },
  {
    id: 'demo-completed',
    candidateFirst: 'Sam',
    candidateLast: 'Chen',
    jobTitle: 'Operations Lead',
    department: 'Operations',
    type: 'TECHNICAL',
    scheduledAt: daysFromNow(-7),
    durationMins: 60,
    location: 'On-site',
    past: true,
    evalPending: false,
    evalSubmitted: true,
  },
]

const TYPE_LABELS: Record<string, string> = {
  PHONE_SCREEN: 'Phone Screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  ONSITE: 'On-site',
  PANEL: 'Panel',
  HIRING_MANAGER: 'Hiring Manager',
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function SandboxInterviewerPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const role = (session?.user as any)?.role as string
  if (role !== 'ADMIN') redirect('/dashboard')

  const upcoming = DEMO_EVENTS.filter(e => !e.past)
  const pendingEval = DEMO_EVENTS.filter(e => e.past && e.evalPending)
  const completed = DEMO_EVENTS.filter(e => e.past && e.evalSubmitted)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 hidden sm:block">Demo Interviewer</span>
          <Link
            href="/dashboard"
            className="text-xs text-white/50 hover:text-white/80 border border-white/20 rounded-md px-3 py-1.5 transition-colors"
          >
            ← Exit Sandbox
          </Link>
        </div>
      </div>

      {/* Sandbox banner */}
      <div className="bg-amber-500 text-white text-center text-xs font-semibold py-1.5 flex items-center justify-center gap-2">
        <Clapperboard className="w-3.5 h-3.5" />
        Sandbox mode — demo data only, nothing is saved
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${pendingEval.length > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
              {pendingEval.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pending eval</p>
          </div>
        </div>

        {/* Action Required */}
        {pendingEval.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
                Action Required
              </h2>
            </div>
            <div className="space-y-3">
              {pendingEval.map(e => (
                <DemoEventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map(e => (
              <DemoEventCard key={e.id} event={e} />
            ))}
          </div>
        </section>

        {/* Recently Completed */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Recently Completed
            </h2>
            <div className="space-y-3">
              {completed.map(e => (
                <DemoEventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Help & FAQ
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {FAQ_ITEMS.map(item => (
              <details key={item.q} className="group px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-3 text-sm font-medium text-gray-800 select-none list-none">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

function DemoEventCard({ event }: { event: typeof DEMO_EVENTS[0] }) {
  const href = event.evalPending
    ? '/sandbox/scorecard'
    : event.evalSubmitted
      ? '#'
      : '/sandbox/upcoming'

  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-base font-semibold text-gray-900">
              {event.candidateFirst} {event.candidateLast}
            </span>
            {event.evalSubmitted ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Eval submitted
              </span>
            ) : event.evalPending ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 font-medium">
                <AlertCircle className="w-3 h-3" /> Eval pending
              </span>
            ) : !event.past ? (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 font-medium">
                View profile →
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">{event.jobTitle} · {event.department}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {fmt(event.scheduledAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {event.durationMins} min
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
          {event.candidateFirst[0]}{event.candidateLast[0]}
        </div>
      </div>
    </Link>
  )
}

const FAQ_ITEMS = [
  { q: 'How do I submit my evaluation?', a: 'Click any interview card to open the detail view, then click "Open scorecard." Fill out each section and hit Submit. You can\'t edit it after submitting, so review your notes before confirming.' },
  { q: "What if I haven't interviewed them yet but the card shows?", a: "You'll show up in upcoming interviews as soon as the recruiter logs it. The evaluation button only matters after the interview happens — there's no deadline set by the system, but submit as soon as possible while it's fresh." },
  { q: "Can I see other interviewers' evaluations?", a: 'No — each evaluation is private. You only see your own assignments and your own submitted scorecards.' },
  { q: "Where is the candidate's resume?", a: "On the scorecard page, the resume is shown on the left panel so you can read it while filling out your feedback." },
  { q: 'What do the ratings mean (A / B / C)?', a: 'A = Strong yes, clearly meets the bar. B = Leaning yes, meets most with some gaps. C = No, doesn\'t meet the bar. Be honest — your feedback directly shapes the hiring decision.' },
  { q: "I can't find my interview — what should I do?", a: "Make sure you're logged in with the same email address the recruiter used when they added you as an interviewer. If you're still not seeing it, ask the recruiter to confirm which email they used." },
]
