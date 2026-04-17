export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Calendar, ClipboardCheck, Briefcase, Clapperboard } from 'lucide-react'

export default async function SandboxHMPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const role = (session?.user as any)?.role as string
  if (role !== 'ADMIN') redirect('/dashboard')

  const now = new Date()
  const d = (offsetDays: number, hour = 10) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + offsetDays)
    dt.setHours(hour, 0, 0, 0)
    return dt
  }

  const DEMO_CANDIDATES = [
    {
      id: 'jordan-lee',
      firstName: 'Jordan',
      lastName: 'Lee',
      initials: 'JL',
      jobTitle: 'Sales Representative',
      department: 'Sales',
      stage: 'INTERVIEW',
      stageLabel: 'Interview',
      stageColor: 'bg-blue-100 text-blue-700',
      evalCount: 2,
      dominantRating: 'A',
      ratingColor: 'bg-green-100 text-green-700',
      hasDecision: false,
      lastInterviewAt: d(-1),
      href: '/sandbox/hiring-manager/jordan-lee',
      status: 'needs-decision',
    },
    {
      id: 'sam-chen',
      firstName: 'Sam',
      lastName: 'Chen',
      initials: 'SC',
      jobTitle: 'Operations Lead',
      department: 'Operations',
      stage: 'FINAL',
      stageLabel: 'Final Round',
      stageColor: 'bg-purple-100 text-purple-700',
      evalCount: 3,
      dominantRating: 'B',
      ratingColor: 'bg-amber-100 text-amber-700',
      hasDecision: true,
      lastInterviewAt: d(-7),
      href: '/sandbox/hiring-manager/sam-chen',
      status: 'decided',
    },
    {
      id: 'alex-rivera',
      firstName: 'Alex',
      lastName: 'Rivera',
      initials: 'AR',
      jobTitle: 'Marketing Manager',
      department: 'Marketing',
      stage: 'PHONE_SCREEN',
      stageLabel: 'Phone Screen',
      stageColor: 'bg-gray-100 text-gray-600',
      evalCount: 0,
      dominantRating: null,
      ratingColor: '',
      hasDecision: false,
      lastInterviewAt: d(2),
      href: '#',
      status: 'in-progress',
    },
    {
      id: 'casey-morgan',
      firstName: 'Casey',
      lastName: 'Morgan',
      initials: 'CM',
      jobTitle: 'Sales Representative',
      department: 'Sales',
      stage: 'BEHAVIORAL',
      stageLabel: 'Behavioral',
      stageColor: 'bg-gray-100 text-gray-600',
      evalCount: 0,
      dominantRating: null,
      ratingColor: '',
      hasDecision: false,
      lastInterviewAt: d(5, 14),
      href: '#',
      status: 'in-progress',
    },
  ]

  const needsDecision = DEMO_CANDIDATES.filter(c => c.status === 'needs-decision')
  const inProgress = DEMO_CANDIDATES.filter(c => c.status === 'in-progress')
  const decided = DEMO_CANDIDATES.filter(c => c.status === 'decided')

  const OPEN_POSITIONS = [
    { title: 'Sales Representative', department: 'Sales', count: 2 },
    { title: 'Marketing Manager', department: 'Marketing', count: 1 },
    { title: 'Operations Lead', department: 'Operations', count: 1 },
  ]

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
            <span className="ml-2 text-white/40 text-xs">Hiring Manager Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 hidden sm:block">Demo Manager</span>
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

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{OPEN_POSITIONS.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Open positions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${needsDecision.length > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
              {needsDecision.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Needs decision</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {DEMO_CANDIDATES.filter(c => c.status === 'in-progress' && c.lastInterviewAt > now).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Upcoming</p>
          </div>
        </div>

        {/* Needs decision */}
        {needsDecision.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
                Needs your decision
              </h2>
            </div>
            <div className="space-y-3">
              {needsDecision.map(c => (
                <DemoCard key={c.id} candidate={c} now={now} />
              ))}
            </div>
          </section>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              In Progress
            </h2>
            <div className="space-y-3">
              {inProgress.map(c => (
                <DemoCard key={c.id} candidate={c} now={now} />
              ))}
            </div>
          </section>
        )}

        {/* Decided */}
        {decided.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Decision Recorded
            </h2>
            <div className="space-y-3">
              {decided.map(c => (
                <DemoCard key={c.id} candidate={c} now={now} />
              ))}
            </div>
          </section>
        )}

        {/* Open positions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Your open positions
            </h2>
          </div>
          <div className="space-y-2">
            {OPEN_POSITIONS.map(pos => (
              <div
                key={pos.title}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{pos.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pos.department}</p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                  {pos.count} applicant{pos.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function DemoCard({ candidate: c, now }: { candidate: any; now: Date }) {
  const isUpcoming = c.lastInterviewAt > now
  const Wrapper = c.href === '#' ? 'div' : Link

  return (
    <Wrapper
      href={c.href}
      className={`block bg-white rounded-xl border border-gray-200 px-5 py-4 transition-all ${
        c.href !== '#' ? 'hover:border-gray-300 hover:shadow-sm cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
            {c.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{c.jobTitle} · {c.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {c.dominantRating && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.ratingColor}`}>
              {c.dominantRating}
            </span>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.stageColor}`}>
            {c.stageLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        {c.evalCount > 0 && (
          <span className="flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            {c.evalCount} evaluation{c.evalCount !== 1 ? 's' : ''}
          </span>
        )}
        {isUpcoming && (
          <span className="flex items-center gap-1 text-blue-500">
            <Calendar className="w-3.5 h-3.5" />
            {c.lastInterviewAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
        {!isUpcoming && !c.evalCount && (
          <span className="text-gray-300">No evaluations yet</span>
        )}
        {c.hasDecision && (
          <span className="flex items-center gap-1 text-green-600 ml-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Decision recorded
          </span>
        )}
        {!c.hasDecision && c.evalCount > 0 && (
          <span className="text-amber-500 font-medium ml-auto">Review feedback →</span>
        )}
      </div>
    </Wrapper>
  )
}
