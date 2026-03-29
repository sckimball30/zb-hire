export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Plus, Calendar, Star, Clock } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, RATING_LABELS, RATING_COLORS, INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils'
import { StageSelector } from '@/components/applications/StageSelector'
import { ScheduleInterviewButton } from '@/components/applications/ScheduleInterviewButton'

export default async function ApplicationPage({
  params,
}: {
  params: { applicationId: string }
}) {
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      candidate: true,
      job: {
        include: {
          interviewers: {
            include: { interviewer: { select: { id: true, name: true, title: true, calendlyUrl: true } } },
          },
        },
      },
      events: {
        include: { interviewer: true, scorecard: true },
        orderBy: { scheduledAt: 'desc' },
      },
      scorecards: {
        include: {
          interviewer: true,
          responses: { include: { question: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      activityLog: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!application) notFound()

  const { candidate, job } = application
  const submittedScorecards = application.scorecards.filter((s) => s.submittedAt)
  const jobInterviewers = job.interviewers.map(ji => ji.interviewer)

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/jobs" className="hover:text-gray-700">Jobs</Link>
          <span>/</span>
          <Link href={`/jobs/${job.id}`} className="hover:text-gray-700">{job.title}</Link>
          <span>/</span>
          <span className="text-gray-700">{candidate.firstName} {candidate.lastName}</span>
        </div>
      </div>

      {/* Candidate Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex-shrink-0">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[application.stage]}`}>
                  {STAGE_LABELS[application.stage]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{candidate.email}</p>
              {candidate.phone && <p className="text-sm text-gray-600">{candidate.phone}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  <strong>Job:</strong> {job.title}
                </span>
                {job.department && (
                  <span className="text-sm text-gray-500">
                    <strong>Dept:</strong> {job.department}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  Applied {formatDate(application.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <StageSelector applicationId={application.id} currentStage={application.stage as any} />
            <Link
              href={`/applications/${application.id}/scorecard/new`}
              className="btn-outline text-xs"
            >
              <Plus className="w-3 h-3" />
              Add Scorecard
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content - left 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Interview Events */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Interviews ({application.events.length})</h2>
              <ScheduleInterviewButton
                applicationId={application.id}
                interviewers={jobInterviewers}
              />
            </div>
            {application.events.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No interviews scheduled yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {application.events.map((event) => (
                  <li key={event.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{INTERVIEW_TYPE_LABELS[event.type]}</span>
                          {event.scorecard && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                              Scored
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          with <strong>{event.interviewer.name}</strong>
                          {event.location && <span> · {event.location}</span>}
                        </div>
                        {event.scheduledAt && (
                          <div className="mt-1 text-sm text-gray-500">
                            {formatDateTime(event.scheduledAt)} · {event.durationMins} min
                          </div>
                        )}
                        {event.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{event.notes}</p>
                        )}
                        {(event as any).calendlyEventUrl && (
                          <a
                            href={(event as any).calendlyEventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            View Calendly Event ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Scorecards */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Scorecards ({submittedScorecards.length} submitted)
              </h2>
              <Link
                href={`/applications/${application.id}/scorecard/new`}
                className="btn-outline text-xs"
              >
                <Plus className="w-3 h-3" />
                Add
              </Link>
            </div>

            {application.scorecards.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No scorecards yet.{' '}
                <Link href={`/applications/${application.id}/scorecard/new`} className="text-blue-600 hover:underline">
                  Add the first one.
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {application.scorecards.map((sc) => (
                  <li key={sc.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{sc.interviewer.name}</span>
                          {sc.overallRating && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RATING_COLORS[sc.overallRating]}`}>
                              {RATING_LABELS[sc.overallRating]}
                            </span>
                          )}
                          {!sc.submittedAt && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                              Draft
                            </span>
                          )}
                        </div>
                        {sc.interviewer.title && (
                          <p className="text-sm text-gray-500 mt-0.5">{sc.interviewer.title}</p>
                        )}
                        {sc.summary && (
                          <p className="mt-2 text-sm text-gray-700">{sc.summary}</p>
                        )}
                        {sc.recommendation && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Recommendation:</strong> {sc.recommendation}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          {sc.responses.length} response{sc.responses.length !== 1 ? 's' : ''}
                          {sc.submittedAt && ` · Submitted ${timeAgo(sc.submittedAt)}`}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar - right 1/3 */}
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Interviews</span>
                <span className="font-medium">{application.events.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Scorecards</span>
                <span className="font-medium">{submittedScorecards.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Days in pipeline</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Activity</h3>
            </div>
            {application.activityLog.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500">No activity yet.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {application.activityLog.map((log) => (
                  <li key={log.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-700">{log.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.actorName && <span>{log.actorName} · </span>}
                          {timeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
