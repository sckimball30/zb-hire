export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Edit2, Calendar, Target, Users, Clock } from 'lucide-react'
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { CopyApplyLink } from '@/components/jobs/CopyApplyLink'

function formatSalary(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default async function JobOverviewPage({ params }: { params: { jobId: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      _count: { select: { applications: true } },
      applications: { select: { stage: true } },
    },
  })
  if (!job) notFound()

  const daysOpen = Math.floor((Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const hired = job.applications.filter(a => a.stage === 'HIRED').length
  const active = job.applications.filter(a => !['HIRED', 'REJECTED'].includes(a.stage)).length

  const salaryRange = (() => {
    if (!job.salaryMin && !job.salaryMax) return null
    const range = job.salaryMin && job.salaryMax
      ? `${formatSalary(job.salaryMin, job.salaryCurrency)} – ${formatSalary(job.salaryMax, job.salaryCurrency)}`
      : job.salaryMin ? `From ${formatSalary(job.salaryMin, job.salaryCurrency)}` : `Up to ${formatSalary(job.salaryMax!, job.salaryCurrency)}`
    return range + (job.payType === 'HOURLY' ? '/hr' : '/yr')
  })()

  const applyUrl = `${process.env.NEXTAUTH_URL || 'https://zb-hires.vercel.app'}/apply/${job.id}`

  return (
    <div className="p-8 max-w-4xl">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[job.status]}`}>
          {JOB_STATUS_LABELS[job.status] ?? job.status}
        </span>
        <Link href={`/jobs/${job.id}/edit`} className="btn-outline flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          Edit Job
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Days Open', value: daysOpen, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Applications', value: job._count.applications, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Pipeline', value: active, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: job.hiringGoal ? `Hired / Goal` : 'Total Hired', value: job.hiringGoal ? `${hired} / ${job.hiringGoal}` : hired, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <div className={`${bg} rounded-md p-1.5`}><Icon className={`w-3.5 h-3.5 ${color}`} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: job details */}
        <div className="col-span-2 space-y-6">
          {/* Apply link */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Public Apply Link</h3>
            <CopyApplyLink url={applyUrl} />
          </div>

          {/* Job description */}
          {job.description && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Job Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {job.description}
              </div>
            </div>
          )}
        </div>

        {/* Right: details sidebar */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>
            {[
              { label: 'Department', value: job.department },
              { label: 'Location', value: job.location },
              { label: 'Type', value: job.employmentType ? (EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType) : null },
              { label: 'Compensation', value: salaryRange },
              { label: 'Hiring Goal', value: job.hiringGoal ? `${job.hiringGoal} hire${job.hiringGoal > 1 ? 's' : ''}` : null },
              { label: 'Interview Rounds', value: job.interviewCount ? `${job.interviewCount} round${job.interviewCount > 1 ? 's' : ''}` : null },
            ].filter(d => d.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
