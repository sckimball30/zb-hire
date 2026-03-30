export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  ArrowLeft, Mail, Phone, Linkedin, ExternalLink,
  MapPin, FileText, Download, Star, Calendar,
  MessageSquare, Clock, ChevronRight, User
} from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'
import { formatDate, timeAgo } from '@/lib/utils'
import { NotesPanel } from '@/components/candidates/NotesPanel'
import { SendMessageButton } from '@/components/candidates/SendMessageButton'
import { CandidateTags } from '@/components/candidates/CandidateTags'

const RATING_COLORS: Record<string, string> = {
  STRONG_YES: 'bg-green-100 text-green-700',
  YES: 'bg-emerald-100 text-emerald-700',
  NEUTRAL: 'bg-gray-100 text-gray-600',
  NO: 'bg-orange-100 text-orange-700',
  STRONG_NO: 'bg-red-100 text-red-700',
}
const RATING_LABELS: Record<string, string> = {
  STRONG_YES: 'Strong Yes', YES: 'Yes', NEUTRAL: 'Neutral',
  NO: 'No', STRONG_NO: 'Strong No',
}

export default async function CandidatePage({ params }: { params: { candidateId: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    include: {
      applications: {
        include: {
          job: true,
          events: { include: { interviewer: true }, orderBy: { scheduledAt: 'asc' } },
          scorecards: {
            include: {
              interviewer: true,
              responses: { include: { question: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          activityLog: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
        orderBy: { createdAt: 'desc' },
      },
      candidateNotes: { orderBy: { createdAt: 'desc' } },
      messageLogs: { orderBy: { sentAt: 'desc' }, take: 10 },
      tags: { include: { tag: true } },
    },
  })

  if (!candidate) notFound()

  const serializedNotes = candidate.candidateNotes.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }))

  const allScorecards = candidate.applications.flatMap(app =>
    app.scorecards.map(sc => ({ ...sc, job: app.job, applicationId: app.id }))
  )
  const allEvents = candidate.applications.flatMap(app =>
    app.events.map(ev => ({ ...ev, job: app.job, applicationId: app.id }))
  )
  const allActivity = candidate.applications
    .flatMap(app => app.activityLog.map(log => ({ ...log, job: app.job })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15)

  const isPDF = candidate.resumeUrl?.toLowerCase().includes('.pdf') ||
    candidate.resumeUrl?.includes('blob.vercel-storage')

  return (
    <div className="p-8 max-w-6xl">
      {/* Back */}
      <Link href="/candidates" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Candidates
      </Link>

      {/* ── Profile Header ─────────────────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#4AFFD2]/20 text-[#111] text-2xl font-bold flex-shrink-0 border-2 border-[#4AFFD2]/40">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {candidate.firstName} {candidate.lastName}
            </h1>
            {candidate.source && (
              <p className="text-sm text-gray-400 mt-0.5">Source: {candidate.source}</p>
            )}
            <div className="mt-2">
              <CandidateTags
                candidateId={candidate.id}
                initialTags={candidate.tags.map(ct => ct.tag)}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Mail className="w-4 h-4 text-gray-400" />{candidate.email}
              </a>
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <Phone className="w-4 h-4 text-gray-400" />{candidate.phone}
                </a>
              )}
              {candidate.address && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" />{candidate.address}
                </span>
              )}
              {candidate.linkedInUrl && (
                <a href={candidate.linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <Linkedin className="w-4 h-4 text-gray-400" />LinkedIn <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">Added {formatDate(candidate.createdAt)}</span>
            <div className="flex gap-2 mt-1">
              {candidate.resumeUrl && (
                <a
                  href={`/api/resume/${candidate.id}?download=1`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Resume
                </a>
              )}
              <SendMessageButton candidateId={candidate.id} candidateEmail={candidate.email} />
            </div>
          </div>
        </div>

        {/* Application chips */}
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
        {/* ── Main Column ──────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">

          {/* Resume */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Resume</h2>
              </div>
              {candidate.resumeUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/resume/${candidate.id}?download=1`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
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
              <div className="px-6 py-12 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No resume on file</p>
                <p className="text-xs text-gray-300 mt-1">Resume will appear here once the candidate submits via the apply form</p>
              </div>
            )}
          </div>

          {/* Interview Feedback / Scorecards */}
          {allScorecards.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Interview Feedback</h2>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{allScorecards.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {allScorecards.map(sc => (
                  <div key={sc.id} className="px-6 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {sc.interviewer.name[0]}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{sc.interviewer.name}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">{sc.job.title}</span>
                        </div>
                        {sc.submittedAt && (
                          <p className="text-xs text-gray-400 mt-0.5 ml-9">{formatDate(sc.submittedAt)}</p>
                        )}
                      </div>
                      {sc.recommendation && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${RATING_COLORS[sc.recommendation] ?? 'bg-gray-100 text-gray-600'}`}>
                          {RATING_LABELS[sc.recommendation] ?? sc.recommendation}
                        </span>
                      )}
                    </div>
                    {sc.summary && (
                      <p className="text-sm text-gray-700 ml-9 mt-2 leading-relaxed">{sc.summary}</p>
                    )}
                    {sc.responses.length > 0 && (
                      <div className="ml-9 mt-3 space-y-2">
                        {sc.responses.filter(r => r.notes).map(r => (
                          <div key={r.id} className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs font-medium text-gray-500">{r.question.text}</p>
                            {r.rating && <p className="text-xs text-gray-400 mt-0.5">Rating: {r.rating}</p>}
                            {r.notes && <p className="text-sm text-gray-700 mt-1">{r.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {!sc.submittedAt && (
                      <p className="text-xs text-amber-500 ml-9 mt-2">Scorecard not yet submitted</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Schedule */}
          {allEvents.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Interviews</h2>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{allEvents.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {allEvents.map(ev => (
                  <div key={ev.id} className="px-6 py-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{ev.type}</span>
                        <span className="text-xs text-gray-400">· {ev.job.title}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {ev.interviewer.name}
                        {ev.scheduledAt && ` · ${formatDate(ev.scheduledAt)}`}
                        {ev.durationMins && ` · ${ev.durationMins} min`}
                      </p>
                      {ev.location && <p className="text-xs text-gray-400 mt-0.5">{ev.location}</p>}
                      {ev.notes && <p className="text-sm text-gray-600 mt-1 italic">"{ev.notes}"</p>}
                    </div>
                    {ev.calendlyEventUrl && (
                      <a href={ev.calendlyEventUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex-shrink-0">
                        View Calendly
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {allActivity.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Activity</h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {allActivity.map(log => (
                  <li key={log.id} className="px-6 py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{log.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.actorName && <span>{log.actorName} · </span>}
                        {log.job.title} · {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Applications */}
          <div className="card overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Applications ({candidate.applications.length})</h2>
            </div>
            {candidate.applications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No applications yet.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {candidate.applications.map(app => (
                  <li key={app.id}>
                    <Link href={`/applications/${app.id}`} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                      <p className="text-sm font-medium text-gray-900 truncate">{app.job.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
                          {STAGE_LABELS[app.stage]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(app.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes */}
          <NotesPanel candidateId={candidate.id} initialNotes={serializedNotes} />

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
