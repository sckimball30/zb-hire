import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import { TeamManager } from '@/components/jobs/TeamManager'

export default async function JobTeamPage({
  params,
}: {
  params: { jobId: string }
}) {
  const [job, allInterviewers] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        interviewers: {
          include: { interviewer: true },
          orderBy: { assignedAt: 'asc' },
        },
      },
    }),
    prisma.interviewer.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!job) notFound()

  const assignedIds = new Set(job.interviewers.map((ji) => ji.interviewerId))
  const availableInterviewers = allInterviewers.filter((i) => !assignedIds.has(i.id))

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/jobs/${params.jobId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </Link>
        <h1 className="page-title">Interview Team</h1>
        <p className="text-sm text-gray-500 mt-1">{job.title}</p>
      </div>

      <TeamManager
        jobId={job.id}
        currentTeam={job.interviewers}
        availableInterviewers={availableInterviewers}
      />
    </div>
  )
}
