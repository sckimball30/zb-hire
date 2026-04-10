export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'

function formatSalary(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      _count: {
        select: { applications: true, interviewers: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage open positions and hiring pipelines</p>
        </div>
        <Link href="/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-gray-500">No jobs found. Create your first job to get started.</p>
          <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>
      ) : (
        <>
          {/* ── Mobile card list ── */}
          <div className="sm:hidden card divide-y divide-gray-100 overflow-hidden">
            {jobs.map((job) => (
              <div key={job.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-gray-900 hover:text-blue-600 leading-snug block truncate">
                      {job.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {[job.department, job.location, job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : null]
                        .filter(Boolean).join(' · ') || 'No details'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{job._count.applications} application{job._count.applications !== 1 ? 's' : ''}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${JOB_STATUS_COLORS[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
                <div className="mt-3">
                  <Link
                    href={`/jobs/${job.id}/pipeline`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View Pipeline →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th className="hidden md:table-cell">Department</th>
                    <th className="hidden lg:table-cell">Location</th>
                    <th className="hidden lg:table-cell">Type</th>
                    <th className="hidden lg:table-cell">Salary Range</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Applications</th>
                    <th className="hidden lg:table-cell">Team</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <Link href={`/jobs/${job.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                          {job.title}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5 md:hidden">{job.department || job.location || ''}</p>
                      </td>
                      <td className="hidden md:table-cell text-gray-600">{job.department || '—'}</td>
                      <td className="hidden lg:table-cell text-gray-600">{job.location || '—'}</td>
                      <td className="hidden lg:table-cell text-gray-600 text-sm">
                        {job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType : '—'}
                      </td>
                      <td className="hidden lg:table-cell text-gray-600 text-sm whitespace-nowrap">
                        {job.salaryMin || job.salaryMax ? (
                          job.salaryMin && job.salaryMax
                            ? `${formatSalary(job.salaryMin, job.salaryCurrency)} – ${formatSalary(job.salaryMax, job.salaryCurrency)}`
                            : job.salaryMin
                              ? `From ${formatSalary(job.salaryMin, job.salaryCurrency)}`
                              : `Up to ${formatSalary(job.salaryMax!, job.salaryCurrency)}`
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[job.status]}`}>
                          {JOB_STATUS_LABELS[job.status]}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell text-gray-700">{job._count.applications}</td>
                      <td className="hidden lg:table-cell text-gray-700">{job._count.interviewers}</td>
                      <td>
                        <Link
                          href={`/jobs/${job.id}/pipeline`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Pipeline
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
