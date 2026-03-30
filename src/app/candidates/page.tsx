export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus, Download } from 'lucide-react'
import { CandidateFilters } from '@/components/candidates/CandidateFilters'
import { Suspense } from 'react'
import { formatDate } from '@/lib/utils'

// Consistent color palette per job — assigned by job order
const JOB_COLORS = [
  { dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  { dot: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  { dot: 'bg-[#4AFFD2]',  pill: 'bg-[#4AFFD2]/20 text-[#0e7a5c] border-[#4AFFD2]/40' },
  { dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  { dot: 'bg-pink-500',   pill: 'bg-pink-50 text-pink-700 border-pink-200' },
  { dot: 'bg-yellow-500', pill: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { dot: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { dot: 'bg-red-500',    pill: 'bg-red-50 text-red-700 border-red-200' },
]

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { q?: string; jobId?: string; dateFrom?: string; dateTo?: string }
}) {
  const query    = searchParams.q?.trim() || ''
  const jobId    = searchParams.jobId || ''
  const dateFrom = searchParams.dateFrom || ''
  const dateTo   = searchParams.dateTo || ''

  // Build application date filter
  const appDateFilter = (dateFrom || dateTo) ? {
    some: {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      },
    },
  } : undefined

  const [candidates, allJobs] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName:  { contains: query, mode: 'insensitive' } },
              { email:     { contains: query, mode: 'insensitive' } },
            ],
          } : {},
          jobId ? { applications: { some: { jobId } } } : {},
          appDateFilter ? { applications: appDateFilter } : {},
        ],
      },
      include: {
        applications: {
          include: { job: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.job.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])

  // Build consistent color map: jobId → color index
  const jobColorMap = new Map(allJobs.map((j, i) => [j.id, JOB_COLORS[i % JOB_COLORS.length]]))

  return (
    <div className="p-8">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/export/candidates" className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <Link href="/candidates/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <Suspense fallback={null}>
          <CandidateFilters
            jobs={allJobs}
            currentQ={query}
            currentJobId={jobId}
            currentDateFrom={dateFrom}
            currentDateTo={dateTo}
          />
        </Suspense>
      </div>

      <div className="card overflow-hidden">
        {candidates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">
              {(query || jobId || dateFrom || dateTo)
                ? 'No candidates match your filters.'
                : 'No candidates yet. Add your first candidate.'}
            </p>
            {!query && !jobId && !dateFrom && !dateTo && (
              <Link href="/candidates/new" className="btn-primary mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Add Candidate
              </Link>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role(s)</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Applied</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const latestApp = candidate.applications[0]
                return (
                  <tr key={candidate.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4AFFD2]/20 text-[#0e7a5c] text-xs font-semibold flex-shrink-0">
                          {candidate.firstName[0]}{candidate.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.applications.length === 0 ? (
                          <span className="text-gray-400 text-sm">—</span>
                        ) : (
                          candidate.applications.map(app => {
                            const color = jobColorMap.get(app.job.id) ?? JOB_COLORS[0]
                            return (
                              <span
                                key={app.id}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${color.pill}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
                                {app.job.title}
                              </span>
                            )
                          })
                        )}
                      </div>
                    </td>
                    <td className="text-gray-600">{candidate.email}</td>
                    <td className="text-gray-600">{candidate.phone || '—'}</td>
                    <td className="text-gray-500 text-sm">
                      {latestApp ? formatDate(latestApp.createdAt) : formatDate(candidate.createdAt)}
                    </td>
                    <td className="text-gray-600">{candidate.source || '—'}</td>
                    <td>
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
