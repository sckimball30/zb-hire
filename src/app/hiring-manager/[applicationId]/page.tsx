export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, FileText, Download, ClipboardCheck, MapPin } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDateTime, normalizeUrl } from '@/lib/utils'
import { HireDecisionPanel } from '@/components/applications/HireDecisionPanel'
import { InterviewerSignOut } from '@/components/interviewer/InterviewerSignOut'
import { NotesRenderer } from '@/components/ui/NotesRenderer'

export default async function HMApplicationPage({
  params,
}: {
  params: { applicationId: string }
}) {
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

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, resumeUrl: true, email: true, phone: true, linkedInUrl: true } },
      job: { select: { id: true, title: true, department: true, hiringManagerId: true } },
      scorecardEntries: {
        orderBy: { createdAt: 'asc' },
      },
      hireDecisions: { orderBy: { createdAt: 'desc' } },
      events: {
        include: { interviewer: { select: { name: true, title: true } } },
        orderBy: { scheduledAt: 'desc' },
      },
    },
  })

  if (!application) notFound()

  // Verify this HM is assigned to the job (or admin previewing)
  if (!isAdminPreview && application.job.hiringManagerId !== userId) {
    redirect('/hiring-manager')
  }

  const { candidate, job } = application

  const submittedEntries = application.scorecardEntries.filter((e) => e.status === 'SUBMITTED')

  // Group entries by section
  const entriesBySection: Record<string, typeof submittedEntries> = {}
  for (const entry of submittedEntries) {
    if (!entriesBySection[entry.sectionTitle]) entriesBySection[entry.sectionTitle] = []
    entriesBySection[entry.sectionTitle].push(entry)
  }
  const sectionGroups = Object.entries(entriesBySection)

  const stageColor = STAGE_COLORS[application.stage as keyof typeof STAGE_COLORS] ?? 'bg-gray-100 text-gray-600'
  const stageLabel = STAGE_LABELS[application.stage as keyof typeof STAGE_LABELS] ?? application.stage

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
        <div className="flex items-center gap-4">
          {isAdminPreview && (
            <Link
              href="/dashboard"
              className="text-xs text-amber-400 border border-amber-400/40 rounded-md px-3 py-1.5 hover:bg-amber-400/10 transition-colors"
            >
              ← Exit preview
            </Link>
          )}
          <span className="text-sm text-white/60 hidden sm:block">{userName}</span>
          {!isAdminPreview && <InterviewerSignOut />}
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <Link
          href="/hiring-manager"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to my candidates
        </Link>

        {/* Candidate card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex items-center justify-center flex-shrink-0">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {candidate.firstName} {candidate.lastName}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {job.title} · {job.department}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${stageColor}`}>
                  {stageLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="text-xs text-blue-600 hover:underline">
                    {candidate.email}
                  </a>
                )}
                {candidate.phone && (
                  <span className="text-xs text-gray-400">{candidate.phone}</span>
                )}
                {candidate.linkedInUrl && (
                  <a href={normalizeUrl(candidate.linkedInUrl)!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    LinkedIn ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Interview summary */}
          {application.events.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Interview history</p>
              {application.events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  <span className="text-gray-500 text-xs">
                    {event.scheduledAt ? formatDateTime(event.scheduledAt) : 'TBD'}
                  </span>
                  <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                    {INTERVIEW_TYPE_LABELS[event.type as keyof typeof INTERVIEW_TYPE_LABELS] ?? event.type}
                  </span>
                  {event.interviewer && (
                    <span className="text-xs text-gray-400">with {event.interviewer.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resume */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
            <div className="w-full bg-gray-50" style={{ height: 600 }}>
              <iframe
                src={`/api/resume/${candidate.id}`}
                className="w-full h-full border-0"
                title="Resume"
              />
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No resume on file yet</p>
            </div>
          )}
        </div>

        {/* Interviewer evaluations — read only */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Interviewer Evaluations ({submittedEntries.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Feedback submitted by your interview team</p>
          </div>

          {sectionGroups.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <ClipboardCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No evaluations submitted yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sectionGroups.map(([sectionTitle, entries]) => (
                <div key={sectionTitle} className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {sectionTitle}
                  </p>
                  <div className="space-y-4">
                    {entries.map((entry) => {
                      let parsed: Record<string, { rating?: string | null; notes?: string | null }> = {}
                      try { parsed = JSON.parse(entry.responses) } catch {}

                      const ratings = Object.values(parsed).map((r) => r?.rating).filter(Boolean) as string[]
                      let dominantRating: string | null = null
                      if (ratings.length) {
                        const counts: Record<string, number> = {}
                        for (const r of ratings) counts[r] = (counts[r] || 0) + 1
                        dominantRating = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
                      }
                      const ratingColor =
                        dominantRating === 'A' ? 'bg-green-100 text-green-700' :
                        dominantRating === 'B' ? 'bg-amber-100 text-amber-700' :
                        dominantRating === 'C' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'

                      return (
                        <EvalEntry key={entry.id} entry={entry} parsed={parsed} dominantRating={dominantRating} ratingColor={ratingColor} />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hire decision — HM submits their own */}
        <HireDecisionPanel
          applicationId={application.id}
          decisions={application.hireDecisions as any}
        />
      </div>
    </div>
  )
}

function EvalEntry({
  entry,
  parsed,
  dominantRating,
  ratingColor,
}: {
  entry: any
  parsed: Record<string, any>
  dominantRating: string | null
  ratingColor: string
}) {
  const questionEntries = Object.entries(parsed).filter(([k]) => !k.startsWith('__'))
  const sectionNotes = parsed['__sectionNotes__'] as string | null | undefined
  const gutCheck = parsed['__gutCheck__'] as { thrilled?: string; team?: string; embarrassed?: string } | null | undefined
  const recommendation = parsed['recommendation']?.value as string | null | undefined

  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{entry.interviewerName}</p>
          {entry.submittedAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {recommendation && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
              recommendation === 'HIRE' ? 'bg-green-700 text-white' :
              recommendation === 'MAYBE' ? 'bg-amber-500 text-white' :
              'bg-red-700 text-white'
            }`}>
              {recommendation}
            </span>
          )}
          {dominantRating && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${ratingColor}`}>
              {dominantRating} Player
            </span>
          )}
        </div>
      </div>

      {/* Per-question ratings */}
      {questionEntries.filter(([, r]) => (r as any)?.rating).length > 0 && (
        <div className="space-y-1.5">
          {questionEntries.map(([qId, response]) => {
            const r = response as { rating?: string | null; notes?: string | null }
            if (!r?.rating) return null
            return (
              <div key={qId} className="flex items-center gap-2 text-xs">
                <span className={`inline-flex items-center px-1.5 py-0 rounded font-bold flex-shrink-0 ${
                  r.rating === 'A' ? 'bg-green-100 text-green-700' :
                  r.rating === 'B' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {r.rating}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* General notes */}
      {sectionNotes && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Notes</p>
          <NotesRenderer text={sectionNotes} />
        </div>
      )}

      {/* Gut check */}
      {gutCheck && (gutCheck.thrilled || gutCheck.team || gutCheck.embarrassed) && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Gut Check</p>
          <div className="space-y-1">
            {gutCheck.thrilled && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Thrilled to work with?</span>
                <span className={`font-medium ${gutCheck.thrilled === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{gutCheck.thrilled}</span>
              </div>
            )}
            {gutCheck.team && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Makes team better?</span>
                <span className={`font-medium ${gutCheck.team === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{gutCheck.team}</span>
              </div>
            )}
            {gutCheck.embarrassed && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Confident they get it done?</span>
                <span className={`font-medium ${gutCheck.embarrassed === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{gutCheck.embarrassed}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
