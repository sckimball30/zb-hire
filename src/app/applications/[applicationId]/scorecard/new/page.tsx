export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, FileText } from 'lucide-react'
import { EvaluationForm } from '@/components/applications/EvaluationForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function NewEvaluationPage({
  params,
}: {
  params: { applicationId: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  const isInterviewer = role === 'INTERVIEWER'
  const currentUserName = (session?.user as any)?.name as string | undefined
  const currentUserId = (session?.user as any)?.id as string | undefined

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
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
          interviewers: {
            include: { interviewer: true },
          },
        },
      },
    },
  })

  if (!application) notFound()

  const entries = await prisma.scorecardEntry.findMany({
    where: { applicationId: params.applicationId },
    orderBy: { createdAt: 'asc' },
  })

  const { candidate, job } = application
  const interviewers = job.interviewers.map((ji) => ji.interviewer)
  const resumeUrl = (candidate as any).resumeUrl as string | null | undefined

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-4">
        <Link
          href={isInterviewer ? '/interviewer' : `/applications/${application.id}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {isInterviewer ? 'My interviews' : 'Back'}
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-gray-900">Submit Evaluation</span>
          <span className="text-sm text-gray-400 ml-2">
            {candidate.firstName} {candidate.lastName} — {job.title}
          </span>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Resume */}
        <div className="hidden lg:flex flex-col w-[48%] border-r border-gray-200 bg-gray-100 flex-shrink-0">
          {resumeUrl ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">
                  {candidate.firstName} {candidate.lastName} — Resume
                </span>
                <a
                  href={`/api/resume/${candidate.id}?download=1`}
                  className="ml-auto text-xs text-blue-600 hover:underline"
                >
                  Download
                </a>
              </div>
              <iframe
                src={`/api/resume/${candidate.id}`}
                className="flex-1 w-full border-0"
                title="Resume"
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No resume on file</p>
              <p className="text-xs text-gray-400">
                Upload one from the candidate's application page.
              </p>
            </div>
          )}
        </div>

        {/* Right — Evaluation form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl">
            <EvaluationForm
              applicationId={application.id}
              interviewers={interviewers}
              template={job.scorecardTemplate as any}
              initialEntries={entries as any}
              availableStart={(application as any).availableStart ?? null}
              salaryExpectation={(application as any).salaryExpectation ?? null}
              currentUserName={currentUserName}
              currentUserId={currentUserId}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
