export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Briefcase, AlertCircle, CheckCircle2, Calendar, User, LogOut, ClipboardCheck } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'
import { InterviewerSignOut } from '@/components/interviewer/InterviewerSignOut'

export default async function HiringManagerHubPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const sessionRole = (session.user as any).role as string
  const cookieStore = cookies()
  const previewRole = cookieStore.get('zbhire_preview_role')?.value
  const isAdminPreview = sessionRole === 'ADMIN' && previewRole === 'HIRING_MANAGER'

  if (sessionRole !== 'HIRING_MANAGER' && !isAdminPreview) {
    redirect('/dashboard')
  }

  const userId = (session.user as any).id as string
  const userName = session.user.name ?? session.user.email ?? 'Hiring Manager'

  // For admin preview: find the first job with a hiring manager assigned
  let jobWhereClause: any = { hiringManagerId: userId }
  if (isAdminPreview) {
    const firstHmJob = await prisma.job.findFirst({
      where: { hiringManagerId: { not: null }, status: 'OPEN' },
    })
    if (firstHmJob?.hiringManagerId) {
      jobWhereClause = { hiringManagerId: firstHmJob.hiringManagerId }
    }
  }

  const jobs = await prisma.job.findMany({
    where: { ...jobWhereClause, status: 'OPEN' },
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const jobIds = jobs.map((j) => j.id)

  // Applications for their jobs — include scorecard entries and events
  const applications = jobIds.length > 0
    ? await prisma.application.findMany({
        where: {
          jobId: { in: jobIds },
          stage: { notIn: ['REJECTED', 'HIRED', 'OFFER'] },
        },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true } },
          job: { select: { id: true, title: true, department: true } },
          scorecardEntries: {
            where: { status: 'SUBMITTED' },
            orderBy: { createdAt: 'desc' },
          },
          hireDecisions: { orderBy: { createdAt: 'desc' } },
          events: {
            where: { scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: 'asc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // Split: needs review = has submitted scorecards, no hire decision
  const needsReview = applications.filter(
    (a) => a.scorecardEntries.length > 0 && a.hireDecisions.length === 0
  )
  const inProgress = applications.filter(
    (a) => a.scorecardEntries.length === 0
  )

  const totalApps = applications.length
  const upcomingInterviews = applications.filter((a) => a.events.length > 0).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HMHeader name={userName} isPreview={isAdminPreview} />

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Open positions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${needsReview.length > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
              {needsReview.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Needs decision</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{upcomingInterviews}</p>
            <p className="text-xs text-gray-500 mt-0.5">Upcoming</p>
          </div>
        </div>

        {/* No jobs assigned */}
        {jobs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">No open positions assigned</h2>
            <p className="text-xs text-gray-400">
              Ask your recruiter to assign you as hiring manager on a job posting.
            </p>
          </div>
        )}

        {/* Needs decision */}
        {needsReview.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
                Needs your decision
              </h2>
            </div>
            <div className="space-y-3">
              {needsReview.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}

        {/* In progress (no scorecards yet) */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              In Progress
            </h2>
            <div className="space-y-3">
              {inProgress.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}

        {/* Open positions summary */}
        {jobs.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Your open positions
            </h2>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{job.department}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                    {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({ app }: { app: any }) {
  const name = `${app.candidate.firstName} ${app.candidate.lastName}`
  const hasScores = app.scorecardEntries.length > 0
  const hasDecision = app.hireDecisions.length > 0
  const upcomingEvent = app.events[0]

  // Dominant rating across all submitted entries
  let dominantRating: string | null = null
  if (hasScores) {
    const allRatings: string[] = []
    for (const entry of app.scorecardEntries) {
      try {
        const parsed = JSON.parse(entry.responses) as Record<string, { rating?: string | null }>
        Object.values(parsed).forEach((r) => { if (r?.rating) allRatings.push(r.rating) })
      } catch {}
    }
    if (allRatings.length) {
      const counts: Record<string, number> = {}
      for (const r of allRatings) counts[r] = (counts[r] || 0) + 1
      dominantRating = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    }
  }

  const ratingColor =
    dominantRating === 'A' ? 'bg-green-100 text-green-700' :
    dominantRating === 'B' ? 'bg-amber-100 text-amber-700' :
    dominantRating === 'C' ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-500'

  const stageColor = STAGE_COLORS[app.stage as keyof typeof STAGE_COLORS] ?? 'bg-gray-100 text-gray-600'
  const stageLabel = STAGE_LABELS[app.stage as keyof typeof STAGE_LABELS] ?? app.stage

  return (
    <Link
      href={`/hiring-manager/${app.id}`}
      className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
            {app.candidate.firstName[0]}{app.candidate.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-400 truncate">{app.job.title} · {app.job.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dominantRating && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${ratingColor}`}>
              {dominantRating}
            </span>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColor}`}>
            {stageLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        {hasScores && (
          <span className="flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            {app.scorecardEntries.length} evaluation{app.scorecardEntries.length !== 1 ? 's' : ''}
          </span>
        )}
        {upcomingEvent && (
          <span className="flex items-center gap-1 text-blue-500">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(upcomingEvent.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
        {!hasScores && !upcomingEvent && (
          <span className="text-gray-300">No evaluations yet</span>
        )}
        {hasDecision && (
          <span className="flex items-center gap-1 text-green-600 ml-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Decision recorded
          </span>
        )}
        {!hasDecision && hasScores && (
          <span className="text-amber-500 font-medium ml-auto">Review feedback →</span>
        )}
      </div>
    </Link>
  )
}

function HMHeader({ name, isPreview }: { name: string; isPreview: boolean }) {
  return (
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
      <div className="flex items-center gap-4">
        {isPreview && (
          <Link
            href="/dashboard"
            className="text-xs text-amber-400 border border-amber-400/40 rounded-md px-3 py-1.5 hover:bg-amber-400/10 transition-colors"
          >
            ← Exit preview
          </Link>
        )}
        <span className="text-sm text-white/60 hidden sm:block">{name}</span>
        {!isPreview && <InterviewerSignOut />}
      </div>
    </div>
  )
}
