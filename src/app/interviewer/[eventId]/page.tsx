export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Download,
  ClipboardCheck,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { InterviewerSignOut } from '@/components/interviewer/InterviewerSignOut'

export default async function InterviewerEventPage({
  params,
}: {
  params: { eventId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const email = session.user.email
  const interviewer = email
    ? await prisma.interviewer.findUnique({ where: { email } })
    : null

  if (!interviewer) redirect('/interviewer')

  const event = await prisma.interviewEvent.findUnique({
    where: { id: params.eventId },
    include: {
      application: {
        include: {
          candidate: true,
          job: {
            include: {
              scorecardTemplate: {
                include: {
                  sections: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                      questions: {
                        orderBy: { sortOrder: 'asc' },
                        include: { question: true },
                      },
                    },
                  },
                },
              },
              interviewers: { include: { interviewer: true } },
            },
          },
        },
      },
      scorecard: { select: { id: true, submittedAt: true } },
    },
  })

  if (!event || event.interviewerId !== interviewer.id) notFound()

  const { application } = event
  const { candidate, job } = application
  const isSubmitted = !!event.scorecard?.submittedAt
  const typeLabel = INTERVIEW_TYPE_LABELS[event.type] ?? event.type
  const isUpcoming = event.scheduledAt ? new Date(event.scheduledAt) > new Date() : false
  const template = job.scorecardTemplate
  const templateSections = template?.sections ?? []

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
        <InterviewerSignOut />
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Back */}
        <Link
          href="/interviewer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to my interviews
        </Link>

        {/* Candidate card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex items-center justify-center flex-shrink-0">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Applying for: <strong>{job.title}</strong></p>
              {job.department && (
                <p className="text-sm text-gray-400">{job.department}</p>
              )}
              {candidate.linkedInUrl && (
                <a
                  href={candidate.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                >
                  LinkedIn profile ↗
                </a>
              )}
            </div>
          </div>

          {/* Interview details */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              {event.scheduledAt ? formatDateTime(event.scheduledAt) : 'Time TBD'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              {event.durationMins} min
            </div>
            <span className="inline-flex items-center text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-0.5">
              {typeLabel}
            </span>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {event.location}
              </div>
            )}
          </div>

          {event.notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <strong>Notes:</strong> {event.notes}
            </div>
          )}
        </div>

        {/* Evaluation CTA — always visible */}
        <div className={`rounded-xl border p-6 ${isSubmitted ? 'bg-green-50 border-green-200' : isUpcoming ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSubmitted ? 'bg-green-100' : isUpcoming ? 'bg-blue-100' : 'bg-indigo-100'}`}>
              {isSubmitted
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : isUpcoming
                  ? <Calendar className="w-5 h-5 text-blue-600" />
                  : <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              }
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                {isSubmitted ? 'Evaluation submitted' : isUpcoming ? 'Interview coming up' : 'Submit your evaluation'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isSubmitted
                  ? `Submitted on ${new Date(event.scorecard!.submittedAt!).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : isUpcoming
                    ? 'Review the questions below and use the scorecard to take notes during the interview.'
                    : 'Share your feedback on this candidate using the scorecard below.'}
              </p>
              {!isSubmitted && (
                <Link
                  href={`/applications/${application.id}/scorecard/new`}
                  className={`inline-flex items-center gap-2 mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${isUpcoming ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {isUpcoming ? 'Open scorecard' : 'Open scorecard'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Interview questions — always visible so interviewers can prepare & reference during the call */}
        {templateSections.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-900">Interview Questions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {templateSections.map((section) => (
                <div key={section.id} className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    {section.title}
                  </p>
                  <ol className="space-y-2 list-decimal list-inside">
                    {section.questions.map((tq) => (
                      <li key={tq.id} className="text-sm text-gray-700 leading-relaxed">
                        {tq.question.text}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-sm text-gray-400">No resume on file yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
