export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { ALL_STAGES, STAGE_LABELS, JOB_STATUS_LABELS, JOB_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { Download, Plus } from 'lucide-react'
import type { CandidateStage, ApplicationWithRelations } from '@/types'
import { JobPageClient } from '@/components/jobs/JobPageClient'

function formatSalary(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default async function JobPipelinePage({ params }: { params: { jobId: string } }) {
  const [job, allInterviewers] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        applications: {
          include: {
            candidate: true,
            _count: { select: { scorecards: true } },
          },
          orderBy: { stageOrder: 'asc' },
        },
        interviewers: {
          include: { interviewer: true },
          orderBy: { assignedAt: 'asc' },
        },
        _count: { select: { applications: true, interviewers: true } },
      },
    }),
    prisma.interviewer.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!job) notFound()

  const grouped = ALL_STAGES.reduce<Record<CandidateStage, ApplicationWithRelations[]>>(
    (acc, stage) => {
      acc[stage] = job.applications.filter(a => a.stage === stage) as unknown as ApplicationWithRelations[]
      return acc
    },
    {} as Record<CandidateStage, ApplicationWithRelations[]>
  )

  const comp = (() => {
    if (!job.salaryMin && !job.salaryMax) return null
    const range = job.salaryMin && job.salaryMax
      ? `${formatSalary(job.salaryMin, job.salaryCurrency)} – ${formatSalary(job.salaryMax, job.salaryCurrency)}`
      : job.salaryMin
        ? `From ${formatSalary(job.salaryMin, job.salaryCurrency)}`
        : `Up to ${formatSalary(job.salaryMax!, job.salaryCurrency)}`
    const suffix = job.payType === 'HOURLY' ? '/hr' : '/yr'
    return range + suffix
  })()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700">Jobs</Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm text-gray-700 font-medium">{job.title}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
              {job.department && <span>{job.department}</span>}
              {job.location && <><span className="text-gray-300">·</span><span>{job.location}</span></>}
              {job.employmentType && (
                <><span className="text-gray-300">·</span>
                  <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}</span></>
              )}
              {comp && <><span className="text-gray-300">·</span><span>{comp}</span></>}
              {job.hiringGoal && (
                <><span className="text-gray-300">·</span>
                  <span>Goal: {job.hiringGoal} hire{job.hiringGoal > 1 ? 's' : ''}</span></>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={`/api/export/applications?jobId=${job.id}`} className="btn-outline">
              <Download className="w-4 h-4" />
              Export CSV
            </a>
            <Link href={`/candidates/new?jobId=${job.id}`} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Candidate
            </Link>
          </div>
        </div>

        {/* Stage summary */}
        <div className="flex items-center gap-4 mt-4">
          {ALL_STAGES.map(stage => (
            <div key={stage} className="text-center">
              <div className="text-sm font-semibold text-gray-900">{grouped[stage].length}</div>
              <div className="text-xs text-gray-500">{STAGE_LABELS[stage]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Client section: status toggle, edit button, interviewer panel, kanban */}
      <JobPageClient
        job={{
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          description: job.description,
          status: job.status,
          employmentType: job.employmentType,
          payType: job.payType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          hiringGoal: job.hiringGoal,
          interviewCount: job.interviewCount,
        }}
        groupedApplications={grouped}
        currentTeam={job.interviewers}
        allInterviewers={allInterviewers}
        jobStatusColors={JOB_STATUS_COLORS}
        jobStatusLabels={JOB_STATUS_LABELS}
      />
    </div>
  )
}
