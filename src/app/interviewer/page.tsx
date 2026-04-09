export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle2, AlertCircle, User, LogOut } from 'lucide-react'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/utils'
import { InterviewerSignOut } from '@/components/interviewer/InterviewerSignOut'

export default async function InterviewerHubPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const email = session.user.email

  const interviewer = email
    ? await prisma.interviewer.findUnique({ where: { email } })
    : null

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <InterviewerHeader name={interviewer.name} />

      <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
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
            <p className="text-2xl font-bold text-amber-500">
              {past.filter((e) => !e.scorecard?.submittedAt).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pending eval</p>
          </div>
        </div>

        {/* Upcoming interviews */}
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

        {/* Past interviews */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Recent
            </h2>
            <div className="space-y-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </section>
        )}
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
