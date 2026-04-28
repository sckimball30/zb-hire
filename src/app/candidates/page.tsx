export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus, Download } from 'lucide-react'
import { CandidateFilters } from '@/components/candidates/CandidateFilters'
import { BulkCandidateTable } from '@/components/candidates/BulkCandidateTable'
import { Suspense } from 'react'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { q?: string; jobId?: string; dateFrom?: string; dateTo?: string; tagId?: string; stage?: string }
}) {
  const query    = searchParams.q?.trim() || ''
  const jobId    = searchParams.jobId || ''
  const dateFrom = searchParams.dateFrom || ''
  const dateTo   = searchParams.dateTo || ''
  const tagId    = searchParams.tagId || ''
  const stage    = searchParams.stage || ''

  const appDateFilter = (dateFrom || dateTo) ? {
    some: {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      },
    },
  } : undefined

  // Job + stage filter: both applied to the same application record
  const appJobStageFilter = (jobId || stage) ? {
    some: {
      ...(jobId  ? { jobId }  : {}),
      ...(stage  ? { stage }  : {}),
    },
  } : undefined

  const [candidates, allJobs, allTags, templates] = await Promise.all([
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
          appJobStageFilter ? { applications: appJobStageFilter } : {},
          appDateFilter     ? { applications: appDateFilter }      : {},
          tagId ? { tags: { some: { tagId } } } : {},
        ],
      },
      include: {
        applications: {
          include: { job: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
        },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.job.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    prisma.messageTemplate.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
  ])

  return (
    <div className="p-4 md:p-8">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="/api/export/candidates" className="btn-outline hidden sm:inline-flex items-center gap-2">
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
            tags={allTags}
            currentQ={query}
            currentJobId={jobId}
            currentDateFrom={dateFrom}
            currentDateTo={dateTo}
            currentTagId={tagId}
            currentStage={stage}
          />
        </Suspense>
      </div>

      {candidates.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-gray-500">
            {(query || jobId || dateFrom || dateTo || tagId || stage)
              ? 'No candidates match your filters.'
              : 'No candidates yet. Add your first candidate.'}
          </p>
          {!query && !jobId && !dateFrom && !dateTo && !tagId && !stage && (
            <Link href="/candidates/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Add Candidate
            </Link>
          )}
        </div>
      ) : (
        <BulkCandidateTable
          candidates={candidates as any}
          jobs={allJobs}
          templates={templates}
          currentJobId={jobId}
        />
      )}
    </div>
  )
}
