import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import { ScorecardForm } from '@/components/scorecards/ScorecardForm'

export default async function NewScorecardPage({
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

  const { candidate, job } = application
  const interviewers = job.interviewers.map((ji) => ji.interviewer)

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/applications/${application.id}`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Application
        </Link>
        <h1 className="page-title">Submit Scorecard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {candidate.firstName} {candidate.lastName} — {job.title}
        </p>
      </div>

      {!job.scorecardTemplate ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600 mb-2">No scorecard template configured for this job.</p>
          <p className="text-sm text-gray-500">
            Contact your admin to set up a scorecard template.
          </p>
        </div>
      ) : (
        <ScorecardForm
          applicationId={application.id}
          template={job.scorecardTemplate}
          interviewers={interviewers}
        />
      )}
    </div>
  )
}
