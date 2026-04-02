export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import { EvaluationForm } from '@/components/applications/EvaluationForm'

export default async function NewEvaluationPage({
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

  const entries = await prisma.scorecardEntry.findMany({
    where: { applicationId: params.applicationId },
    orderBy: { createdAt: 'asc' },
  })

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
        <h1 className="page-title">Submit Evaluation</h1>
        <p className="text-sm text-gray-500 mt-1">
          {candidate.firstName} {candidate.lastName} — {job.title}
        </p>
      </div>

      <EvaluationForm
        applicationId={application.id}
        interviewers={interviewers}
        template={job.scorecardTemplate as any}
        initialEntries={entries as any}
        availableStart={(application as any).availableStart ?? null}
        salaryExpectation={(application as any).salaryExpectation ?? null}
      />
    </div>
  )
}
