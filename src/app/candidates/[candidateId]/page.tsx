export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  ArrowLeft, FileText, Download, Clock, Calendar,
  ClipboardCheck, Plus, Linkedin, ExternalLink,
  MapPin, MessageSquare, ChevronRight
} from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils'
import { NotesPanel } from '@/components/candidates/NotesPanel'
import { SendMessageButton } from '@/components/candidates/SendMessageButton'
import { CandidateTags } from '@/components/candidates/CandidateTags'
import { ScheduledMessagesList } from '@/components/candidates/ScheduledMessagesList'
import { ResumeUploadButton } from '@/components/candidates/ResumeUploadButton'

export default async function CandidatePage({ params }: { params: { candidateId: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    include: {
      applications: {
        include: {
          job: true,
          events: { include: { interviewer: true }, orderBy: { scheduledAt: 'desc' } },
          scorecardEntries: { orderBy: { createdAt: 'asc' } },
          activityLog: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
        orderBy: { createdAt: 'desc' },
      },
      candidateNotes: { orderBy: { createdAt: 'desc' } },
      messageLogs: { orderBy: { sentAt: 'desc' }, take: 10 },
      tags: { include: { tag: true } },
      scheduledMessages: {
        where: { sentAt: null },
        orderBy: { scheduledFor: 'asc' },
      },
    },
  })

  if (!candidate) notFound()

  const serializedNotes = candidate.candidateNotes.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }))

  const allEvents = candidate.applications.flatMap(app =>
    app.events.map(ev => ({ ...ev, job: app.job, applicationId: app.id }))
  ).sort((a, b) => (b.scheduledAt?.getTime() ?? 0) - (a.scheduledAt?.getTime() ?? 0))

  const allActivity = candidate.applications
    .flatMap(app => app.activityLog.map(log => ({ ...log, job: app.job })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15)

  const allEntries = candidate.applications.flatMap(app =>
    (app.scorecardEntries as any[]).map((e: any) => ({ ...e, job: app.job, applicationId: app.id }))
  )
  const submittedEntries = allEntries.filter((e: any) => e.status === 'SUBMITTED')
  const entriesBySection = submittedEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    if (!acc[entry.sectionTitle]) acc[entry.sectionTitle] = []
    acc[entry.sectionTitle].push(entry)
    return acc
  }, {})
  const sectionGroups = Object.entries(entriesBySection) as [string, any[]][]

  // Most recent application (for stage display)
  const latestApp = candidate.applications[0] ?? null

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/candidates" className="hover:text-gray-700">Candidates</Link>
          <span>/</span>
          <span className="text-gray-700">{candidate.firstName} {candidate.lastName}</span>
        </div>
      </div>

      {/* ── Header — same format as application page ─────────────────── */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex-shrink-0">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                {latestApp && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[latestApp.stage]}`}>
                    {STAGE_LABELS[latestApp.stage]}
                  </span>
                )}
              </div>

              {/* Contact info */}
              <p className="text-sm text-gray-600 mt-1">{candidate.email}</p>
              {candidate.phone && <p className="text-sm text-gray-600">{candidate.phone}</p>}

              {/* Extra contact — LinkedIn, address */}
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

              {/* Applied date + job info */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {latestApp && (
                  <>
                    <span className="text-sm text-gray-500">
                      <strong>Job:</strong> {latestApp.job.title}
                    </span>
                    {latestApp.job.department && (
                      <span className="text-sm text-gray-500">
                        <strong>Dept:</strong> {latestApp.job.department}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      Applied {formatDate(latestApp.createdAt)}
                    </span>
                  </>
                )}
              </div>

              {/* Tags */}
              <div className="mt-2">
                <CandidateTags
                  candidateId={candidate.id}
                  initialTags={candidate.tags.map(ct => ct.tag)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400">Added {formatDate(candidate.createdAt)}</span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <SendMessageButton
                candidateId={candidate.id}
                candidateEmail={candidate.email}
                candidateFirstName={candidate.firstName}
                jobTitle={latestApp?.job.title}
              />
              {latestApp && (
                <Link
                  href={`/applications/${latestApp.id}/scorecard/new`}
                  className="btn-outline text-xs"
                >
                  <ClipboardCheck className="w-3 h-3" />
                  Add Evaluation
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Application chips — all roles this candidate applied to */}
        {candidate.applications.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {candidate.applications.map(app => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium">{app.job.title}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
                  {STAGE_LABELS[app.stage]}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── Main column (2/3) ─────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">

          {/* Resume */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Resume</h2>
              </div>
              <div className="flex items-center gap-2">
                {candidate.resumeUrl && (
                  <a
                    href={`/api/resume/${candidate.id}?download=1`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                <ResumeUploadButton candidateId={candidate.id} />
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
                <p className="text-xs text-gray-300 mt-1">Use the Upload Resume button above</p>
              </div>
            )}
          </div>

          {/* Interviews */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Interviews ({allEvents.length})</h2>
            </div>
            {allEvents.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No interviews scheduled yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {allEvents.map(event => (
                  <li key={event.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {INTERVIEW_TYPE_LABELS[(event as any).type] ?? (event as any).type}
                          </span>
                          <span className="text-xs text-gray-400">· {event.job.title}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          with <strong>{event.interviewer.name}</strong>
                          {(event as any).location && <span> · {(event as any).location}</span>}
                        </div>
                        {event.scheduledAt && (
                          <div className="mt-1 text-sm text-gray-500">
                            {formatDateTime(event.scheduledAt)} · {(event as any).durationMins} min
                          </div>
                        )}
                        {(event as any).notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{(event as any).notes}</p>
                        )}
                        {(event as any).calendlyEventUrl && (
                          <a href={(event as any).calendlyEventUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
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

          {/* Evaluations */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Evaluations ({submittedEntries.length})</h2>
                <p className="text-xs text-gray-400 mt-0.5">Interview feedback by section</p>
              </div>
              {latestApp && (
                <Link href={`/applications/${latestApp.id}/scorecard/new`} className="btn-primary text-xs">
                  <Plus className="w-3 h-3" /> Add Evaluation
                </Link>
              )}
            </div>

            {sectionGroups.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ClipboardCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No evaluations yet.</p>
                {latestApp && (
                  <Link href={`/applications/${latestApp.id}/scorecard/new`}
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                    Submit the first one →
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sectionGroups.map(([sectionTitle, entries]) => (
                  <div key={sectionTitle} className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{sectionTitle}</p>
                    <ul className="space-y-1.5">
                      {entries.map((entry: any) => {
                        let dominantRating: string | null = null
                        try {
                          const parsed = JSON.parse(entry.responses) as Record<string, { rating?: string | null }>
                          const ratings = Object.values(parsed).map(r => r?.rating).filter(Boolean) as string[]
                          if (ratings.length) {
                            const counts: Record<string, number> = {}
                            for (const r of ratings) counts[r] = (counts[r] || 0) + 1
                            dominantRating = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
                          }
                        } catch {}
                        const ratingColor = dominantRating === 'A' ? 'bg-green-100 text-green-700'
                          : dominantRating === 'B' ? 'bg-amber-100 text-amber-700'
                          : dominantRating === 'C' ? 'bg-red-100 text-red-700'
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
                              {entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
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

        {/* ── Sidebar (1/3) ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Summary */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Applications</span>
                <span className="font-medium">{candidate.applications.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Interviews</span>
                <span className="font-medium">{allEvents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Evaluations</span>
                <span className="font-medium">{submittedEntries.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Days in system</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </div>
          </div>

          {/* Activity */}
          {allActivity.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Activity</h3>
              </div>
              <ul className="divide-y divide-gray-50">
                {allActivity.map(log => (
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
            </div>
          )}

          {/* Notes */}
          <NotesPanel candidateId={candidate.id} initialNotes={serializedNotes} />

          {/* Scheduled Messages */}
          <ScheduledMessagesList
            candidateId={candidate.id}
            initialMessages={(candidate.scheduledMessages as any[]).map((m: any) => ({
              ...m,
              scheduledFor: m.scheduledFor.toISOString(),
              createdAt: m.createdAt.toISOString(),
            }))}
          />

          {/* Message History */}
          {candidate.messageLogs.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Messages</h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {candidate.messageLogs.map(msg => (
                  <li key={msg.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{msg.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {msg.sentByName && <span>{msg.sentByName} · </span>}
                      {formatDate(msg.sentAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
