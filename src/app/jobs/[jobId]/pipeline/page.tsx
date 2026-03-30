export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ALL_STAGES, STAGE_LABELS } from '@/lib/constants'
import { Download, Plus } from 'lucide-react'
import type { CandidateStage, ApplicationWithRelations } from '@/types'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'

export default async function JobPipelinePage({ params }: { params: { jobId: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      applications: {
        include: {
          candidate: true,
          _count: { select: { scorecards: true } },
        },
        orderBy: { stageOrder: 'asc' },
      },
    },
  })

  if (!job) notFound()

  const grouped = ALL_STAGES.reduce<Record<CandidateStage, ApplicationWithRelations[]>>(
    (acc, stage) => {
      acc[stage] = job.applications.filter(a => a.stage === stage) as unknown as ApplicationWithRelations[]
      return acc
    },
    {} as Record<CandidateStage, ApplicationWithRelations[]>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline action bar */}
      <div className="px-8 py-4 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        {/* Stage summary */}
        <div className="flex items-center gap-4">
          {ALL_STAGES.map(stage => (
            <div key={stage} className="text-center">
              <div className="text-sm font-semibold text-gray-900">{grouped[stage].length}</div>
              <div className="text-xs text-gray-500">{STAGE_LABELS[stage]}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
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

      {/* Kanban board */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <KanbanBoard groupedApplications={grouped} jobId={job.id} />
      </div>
    </div>
  )
}
