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
    <div className="p-8">
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

      <div className="card overflow-hidden">
        {jobs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No jobs found. Create your first job to get started.</p>
            <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              New Job
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Department</th>
                <th>Location</th>
                <th>Type</th>
                <th>Salary Range</th>
                <th>Status</th>
                <th>Applications</th>
                <th>Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="font-medium text-gray-900">{job.title}</div>
                  </td>
                  <td className="text-gray-600">{job.department || '—'}</td>
                  <td className="text-gray-600">{job.location || '—'}</td>
                  <td className="text-gray-600 text-sm">
                    {job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType : '—'}
                  </td>
                  <td className="text-gray-600 text-sm whitespace-nowrap">
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
                  <td className="text-gray-700">{job._count.applications}</td>
                  <td className="text-gray-700">{job._count.interviewers}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Pipeline
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/jobs/${job.id}/team`}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Team
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
