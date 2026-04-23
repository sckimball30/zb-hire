export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getGmailStatus } from '@/lib/gmail'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, FileText, Download, ClipboardCheck, Linkedin, ExternalLink, MapPin, User, Video, Phone, Users, Briefcase, Ban } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, INTERVIEW_TYPE_LABELS, REJECTION_REASONS } from '@/lib/constants'
import { formatDate, formatDateTime, timeAgo, isNewApplicant } from '@/lib/utils'
import { StageSelector } from '@/components/applications/StageSelector'
import { ScheduleInterviewButton } from '@/components/applications/ScheduleInterviewButton'
import { SendMessageButton } from '@/components/candidates/SendMessageButton'
import { OfferPanel } from '@/components/offers/OfferPanel'
import { CandidateTags } from '@/components/candidates/CandidateTags'
import { MessagesCard } from '@/components/candidates/MessagesCard'
import { TransferJobButton } from '@/components/applications/TransferJobButton'
import { HireDecisionPanel } from '@/components/applications/HireDecisionPanel'
import { EditCandidateButton } from '@/components/candidates/EditCandidateButton'
import { BlockCandidateButton } from '@/components/candidates/BlockCandidateButton'
import { ResumeUploadButton } from '@/components/candidates/ResumeUploadButton'
import { EvaluationEntryRow } from '@/components/applications/EvaluationEntryRow'
import { EditInterviewButton } from '@/components/applications/EditInterviewButton'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function ApplicationPage({
  params,
  searchParams,
}: {
  params: { applicationId: string }
  searchParams: { jobId?: string }
}) {
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      candidate: {
        include: {
          tags: { include: { tag: true } },
          messageLogs: {
            include: { template: { select: { name: true } } },
            orderBy: { sentAt: 'desc' },
          },
          scheduledMessages: {
            where: { sentAt: null },
            orderBy: { scheduledFor: 'asc' },
          },
        },
      },
      job: {
        include: {
          interviewers: {
            include: { interviewer: { select: { id: true, name: true, title: true, calendlyUrl: true } } },
          },
          recruiters: { select: { userId: true } },
          scorecardTemplate: {
            include: {
              sections: {
                include: {
                  questions: { include: { question: true } },
                },
              },
            },
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

  // Prev/next navigation within the same job pipeline
  const pipelineJobId = searchParams.jobId ?? application.jobId
  const siblings = await prisma.application.findMany({
    where: { jobId: pipelineJobId },
    select: { id: true },
    orderBy: { stageOrder: 'asc' },
  })
  const siblingIdx = siblings.findIndex(s => s.id === application.id)
  const prevApp = siblingIdx > 0 ? siblings[siblingIdx - 1] : null
  const nextApp = siblingIdx < siblings.length - 1 ? siblings[siblingIdx + 1] : null
  const { connected: gmailConnected } = await getGmailStatus()
  const session = await getServerSession(authOptions)
  const currentUserId = (session?.user as any)?.id ?? null

  // Only the hiring manager and assigned recruiters can see hire decisions
  const userRole = (session?.user as any)?.role as string | undefined
  const recruiterIds = new Set(job.recruiters.map((r: any) => r.userId))
  const canSeeDecisions =
    currentUserId &&
    (
      userRole === 'ADMIN' ||
      job.hiringManagerId === currentUserId ||
      recruiterIds.has(currentUserId) ||
      userRole === 'HIRING_MANAGER'
    )

  const submittedScorecards = application.scorecards.filter((s) => s.submittedAt)
  const jobInterviewers = job.interviewers.map(ji => ji.interviewer)

  // Build a map of questionId → question text from the scorecard template
  const questionMap: Record<string, string> = {}
  const template = (job as any).scorecardTemplate
  if (template?.sections) {
    for (const section of template.sections) {
      for (const tq of section.questions) {
        questionMap[tq.question.id] = tq.question.text
      }
    }
  }

  // Group scorecard entries by section
  const scorecardEntries = (application as any).scorecardEntries ?? []
  const submittedEntries = scorecardEntries.filter((e: any) => e.status === 'SUBMITTED')
  const entriesBySection = submittedEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    if (!acc[entry.sectionTitle]) acc[entry.sectionTitle] = []
    acc[entry.sectionTitle].push(entry)
    return acc
  }, {} as Record<string, any[]>)
  const sectionGroups = Object.entries(entriesBySection) as [string, any[]][]

  const canExpandEvaluations =
    userRole === 'ADMIN' ||
    userRole === 'HIRING_MANAGER' ||
    recruiterIds.has(currentUserId ?? '')

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Breadcrumb + prev/next nav */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/jobs" className="hover:text-gray-700">Jobs</Link>
          <span>/</span>
          <Link href={`/jobs/${job.id}/pipeline`} className="hover:text-gray-700">{job.title}</Link>
          <span>/</span>
          <span className="text-gray-700">{candidate.firstName} {candidate.lastName}</span>
        </div>

        {siblings.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-2">
              {siblingIdx + 1} / {siblings.length}
            </span>
            {prevApp ? (
              <Link
                href={`/applications/${prevApp.id}?jobId=${pipelineJobId}`}
                className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Previous applicant"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 rounded-md border border-gray-100 text-gray-200 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}
            {nextApp ? (
              <Link
                href={`/applications/${nextApp.id}?jobId=${pipelineJobId}`}
                className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Next applicant"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 rounded-md border border-gray-100 text-gray-200 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Candidate Header */}
      <div className="card p-6 mb-6">
        {/* Top row: avatar + info + stage selector */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex-shrink-0">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {candidate.firstName} {candidate.lastName}
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[application.stage]}`}>
                    {STAGE_LABELS[application.stage]}
                  </span>
                  {isNewApplicant(application.createdAt) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                      New
                    </span>
                  )}
                  {application.stage === 'REJECTED' && (application as any).rejectionReason && (() => {
                    const reason = REJECTION_REASONS.find(r => r.value === (application as any).rejectionReason)
                    return reason ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reason.color}`}>
                        {reason.label}
                      </span>
                    ) : null
                  })()}
                  {(candidate as any).blocked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      <Ban className="w-3 h-3" /> Do Not Contact
                    </span>
                  )}
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

              {/* Stage selector — top-right */}
              <div className="flex-shrink-0">
                <StageSelector
                  applicationId={application.id}
                  currentStage={application.stage as any}
                  candidateId={candidate.id}
                  candidateEmail={candidate.email}
                  candidateFirstName={candidate.firstName}
                  jobTitle={job.title}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons — full-width row at bottom */}
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
          <SendMessageButton
            candidateId={candidate.id}
            candidateEmail={candidate.email}
            candidateFirstName={candidate.firstName}
            jobTitle={application.job.title}
            blocked={(candidate as any).blocked}
          />
          <BlockCandidateButton
            candidateId={candidate.id}
            blocked={(candidate as any).blocked}
          />
          <ScheduleInterviewButton
            applicationId={application.id}
            interviewers={jobInterviewers}
            candidateId={candidate.id}
            candidateEmail={candidate.email}
            candidateFirstName={candidate.firstName}
            jobTitle={job.title}
          />
          <Link
            href={`/applications/${application.id}/scorecard/new`}
            className="btn-outline text-xs"
          >
            <ClipboardCheck className="w-3 h-3" />
            Add Evaluation
          </Link>
          <TransferJobButton
            applicationId={application.id}
            currentJobId={job.id}
            currentJobTitle={job.title}
            candidateName={`${candidate.firstName} ${candidate.lastName}`}
          />
          <EditCandidateButton
            candidate={{
              id: candidate.id,
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              email: candidate.email ?? '',
              phone: candidate.phone ?? null,
              linkedInUrl: candidate.linkedInUrl ?? null,
              source: candidate.source ?? null,
              notes: candidate.notes ?? null,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main content - left 2/3 */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">

          {/* Resume */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Resume</h2>
              </div>
              <div className="flex items-center gap-3">
                <ResumeUploadButton candidateId={candidate.id} />
                {candidate.resumeUrl && (
                  <a
                    href={`/api/resume/${candidate.id}?download=1`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
              </div>
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

          {/* Offer — only shown when candidate is at Offer stage or beyond */}
          {(application.offer || ['OFFER', 'HIRED'].includes(application.stage)) && (
            <OfferPanel
              offer={application.offer as any}
              applicationId={application.id}
              jobTitle={job.title}
            />
          )}

          {/* Hire Decisions — visible to hiring manager + recruiters only */}
          {canSeeDecisions && (
            <HireDecisionPanel
              applicationId={application.id}
              decisions={application.hireDecisions as any}
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
                      {sectionEntries.map((entry: any) => (
                        <EvaluationEntryRow
                          key={entry.id}
                          entry={entry}
                          questionMap={questionMap}
                          canExpand={!!canExpandEvaluations}
                        />
                      ))}
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

          {/* Scheduled Interviews */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Interviews</h3>
              </div>
            </div>
            {application.events.length === 0 ? (
              <div className="px-4 py-4 text-xs text-gray-400 text-center">No interviews scheduled yet.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {application.events.map((event) => {
                  const typeIcon = event.type === 'PHONE_SCREEN' ? <Phone className="w-3 h-3" />
                    : event.type === 'VIDEO_CALL' ? <Video className="w-3 h-3" />
                    : event.type === 'PANEL' ? <Users className="w-3 h-3" />
                    : event.type === 'WORKING_INTERVIEW' ? <Briefcase className="w-3 h-3" />
                    : <Calendar className="w-3 h-3" />
                  return (
                    <li key={event.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 flex-shrink-0 ${event.type === 'WORKING_INTERVIEW' ? 'text-amber-500' : 'text-gray-400'}`}>{typeIcon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800">
                            {INTERVIEW_TYPE_LABELS[event.type] ?? event.type}
                          </p>
                          {event.interviewer && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              with <span className="font-medium">{event.interviewer.name}</span>
                            </p>
                          )}
                          {event.scheduledAt ? (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDateTime(event.scheduledAt)} · {event.durationMins}min
                            </p>
                          ) : (
                            <p className="text-xs text-amber-500 mt-0.5">Awaiting confirmation</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{event.location}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {event.scorecard && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">✓</span>
                          )}
                          <EditInterviewButton
                            applicationId={application.id}
                            interviewers={jobInterviewers}
                            event={{
                              id: event.id,
                              interviewerId: event.interviewerId ?? null,
                              type: event.type,
                              scheduledAt: event.scheduledAt ? event.scheduledAt.toISOString() : null,
                              durationMins: event.durationMins,
                              location: event.location ?? null,
                              notes: event.notes ?? null,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
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
          {/* Messages */}
          <MessagesCard
            candidateId={candidate.id}
            initialMessages={(candidate as any).messageLogs ?? []}
            scheduledMessages={(candidate as any).scheduledMessages ?? []}
            gmailConnected={gmailConnected}
          />
        </div>
      </div>
    </div>
  )
}
