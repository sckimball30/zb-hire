export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Plus, Calendar, Clock, FileText, Download, ClipboardCheck, Linkedin, ExternalLink, MapPin, User } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils'
import { StageSelector } from '@/components/applications/StageSelector'
import { ScheduleInterviewButton } from '@/components/applications/ScheduleInterviewButton'
import { SendMessageButton } from '@/components/candidates/SendMessageButton'
import { OfferPanel } from '@/components/offers/OfferPanel'
import { CandidateTags } from '@/components/candidates/CandidateTags'

export default async function ApplicationPage({
  params,
}: {
  params: { applicationId: string }
}) {
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      candidate: {
        include: { tags: { include: { tag: true } } },
      },
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
      scorecardEntries: {
        orderBy: { createdAt: 'asc' },
      },
      activityLog: {
        orderBy: { createdAt: 'desc' },
      },
      offer: true,
      hireDecisions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!application) notFound()

  const { candidate, job } = application
  const submittedScorecards = application.scorecards.filter((s) => s.submittedAt)
  const jobInterviewers = job.interviewers.map(ji => ji.interviewer)

  // Group scorecard entries by section
  const scorecardEntries = (application as any).scorecardEntries ?? []
  const submittedEntries = scorecardEntries.filter((e: any) => e.status === 'SUBMITTED')
  const entriesBySection = submittedEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    if (!acc[entry.sectionTitle]) acc[entry.sectionTitle] = []
    acc[entry.sectionTitle].push(entry)
    return acc
  }, {} as Record<string, any[]>)
  const sectionGroups = Object.entries(entriesBySection) as [string, any[]][]

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
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[application.stage]}`}>
                  {STAGE_LABELS[application.stage]}
                </span>
              </div>

              {/* Contact */}
              <p className="text-sm text-gray-600 mt-1">{candidate.email}</p>
              {candidate.phone && <p className="text-sm text-gray-600">{candidate.phone}</p>}

              {/* LinkedIn / Address / Source */}
              <div className="flex flex-wrap items-center gap-4 mt-1">
                {candidate.linkedInUrl && (
                  <a href={candidate.linkedInUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {(candidate as any).address && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />{(candidate as any).address}
                  </span>
                )}
                {candidate.source && (
                  <span className="text-sm text-gray-500">Source: {candidate.source}</span>
                )}
              </div>

              {/* Job / Dept / Applied */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
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
                <Link
                  href={`/candidates/${candidate.id}`}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <User className="w-3.5 h-3.5" /> Full Profile
                </Link>
              </div>

              {/* Tags */}
              <div className="mt-2">
                <CandidateTags
                  candidateId={candidate.id}
                  initialTags={(candidate as any).tags?.map((ct: any) => ct.tag) ?? []}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <StageSelector applicationId={application.id} currentStage={application.stage as any} />
            <div className="flex items-center gap-2">
              <SendMessageButton
                candidateId={candidate.id}
                candidateEmail={candidate.email}
                candidateFirstName={candidate.firstName}
                jobTitle={application.job.title}
              />
              <Link
                href={`/applications/${application.id}/scorecard/new`}
                className="btn-outline text-xs"
              >
                <ClipboardCheck className="w-3 h-3" />
                Add Evaluation
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content - left 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Resume */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Resume</h2>
              </div>
              {candidate.resumeUrl && (
                <a
                  href={`/api/resume/${candidate.id}?download=1`}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              )}
            </div>
            {candidate.resumeUrl ? (
              <div className="w-full bg-gray-50" style={{ height: 700 }}>
                <iframe
                  src={`/api/resume/${candidate.id}`}
                  className="w-full h-full border-0"
                  title="Resume"
                />
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No resume on file</p>
              </div>
            )}
          </div>

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

          {/* Offer — only shown when candidate is at Offer stage or beyond */}
          {['OFFER', 'HIRED'].includes(application.stage) && (
            <OfferPanel
              offer={application.offer as any}
              applicationId={application.id}
              jobTitle={job.title}
            />
          )}

          {/* Evaluations */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Evaluations ({submittedEntries.length})
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Interview feedback by section</p>
              </div>
              <Link
                href={`/applications/${application.id}/scorecard/new`}
                className="btn-primary text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Evaluation
              </Link>
            </div>

            {sectionGroups.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ClipboardCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No evaluations yet.</p>
                <Link
                  href={`/applications/${application.id}/scorecard/new`}
                  className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                  Submit the first one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sectionGroups.map(([sectionTitle, sectionEntries]) => (
                  <div key={sectionTitle} className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {sectionTitle}
                    </p>
                    <ul className="space-y-1.5">
                      {sectionEntries.map((entry: any) => {
                        // Compute most common rating
                        let dominantRating: string | null = null
                        try {
                          const parsed = JSON.parse(entry.responses) as Record<string, { rating?: string | null }>
                          const ratings = Object.values(parsed).map((r) => r?.rating).filter(Boolean) as string[]
                          if (ratings.length) {
                            const counts: Record<string, number> = {}
                            for (const r of ratings) counts[r] = (counts[r] || 0) + 1
                            dominantRating = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
                          }
                        } catch {}
                        const ratingColor =
                          dominantRating === 'A'
                            ? 'bg-green-100 text-green-700'
                            : dominantRating === 'B'
                            ? 'bg-amber-100 text-amber-700'
                            : dominantRating === 'C'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'

                        return (
                          <li key={entry.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-800">{entry.interviewerName}</span>
                            {dominantRating && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${ratingColor}`}>
                                {dominantRating} Player
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {entry.submittedAt
                                ? new Date(entry.submittedAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : ''}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
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
                <span className="text-gray-500">Evaluations</span>
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
