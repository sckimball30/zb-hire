'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Clock, ClipboardCheck, Plus, Mail, Star } from 'lucide-react'
import { ALL_STAGES, STAGE_LABELS } from '@/lib/constants'
import { isNewApplicant } from '@/lib/utils'
import type { CandidateStage, ApplicationWithRelations } from '@/types'

interface MobilePipelineViewProps {
  groupedApplications: Record<CandidateStage, ApplicationWithRelations[]>
  jobId: string
  contactedCandidateIds?: string[]
}

export function MobilePipelineView({
  groupedApplications,
  jobId,
  contactedCandidateIds = [],
}: MobilePipelineViewProps) {
  const contactedSet = new Set(contactedCandidateIds)

  const [activeStage, setActiveStage] = useState<CandidateStage>(() => {
    return ALL_STAGES.find(s => (groupedApplications[s]?.length ?? 0) > 0) ?? 'APPLIED'
  })

  const candidates = groupedApplications[activeStage] ?? []

  return (
    <div className="relative">
      {/* Stage tabs — sticky, horizontally scrollable */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex overflow-x-auto scrollbar-none">
        {ALL_STAGES.map(stage => {
          const count = groupedApplications[stage]?.length ?? 0
          const active = stage === activeStage
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {STAGE_LABELS[stage]}
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-gray-400 text-sm">No candidates in {STAGE_LABELS[activeStage]}</p>
          <Link
            href={`/candidates/new?jobId=${jobId}`}
            className="mt-4 text-sm text-blue-600 font-medium"
          >
            Add the first one →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {candidates.map(app => {
            const candidate = (app as any).candidate
            const scorecardCount = (app as any)._count?.scorecards ?? 0
            const daysAgo = Math.floor(
              (Date.now() - new Date((app as any).createdAt).getTime()) / (1000 * 60 * 60 * 24)
            )
            const isNew = isNewApplicant((app as any).createdAt)
            const isContacted = contactedSet.has(candidate?.id ?? '')
            const starRating = (app as any).starRating as number | null

            return (
              <li key={app.id}>
                <Link
                  href={`/applications/${app.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                >
                  {/* Avatar with "new" dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      {candidate?.firstName?.[0]}{candidate?.lastName?.[0]}
                    </div>
                    {isNew && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-[15px] leading-snug">
                      {candidate?.firstName} {candidate?.lastName}
                    </p>
                    <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d`}
                      </span>
                      {scorecardCount > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <ClipboardCheck className="w-3 h-3" />
                          {scorecardCount}
                        </span>
                      )}
                      {isContacted && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Mail className="w-3 h-3" />
                          Contacted
                        </span>
                      )}
                      {starRating && (
                        <span className="text-xs text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {starRating}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {/* FAB — Add candidate, sits above the bottom tab bar */}
      <Link
        href={`/candidates/new?jobId=${jobId}`}
        className="fixed right-4 z-20 w-14 h-14 bg-[#111111] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1rem)' }}
        aria-label="Add candidate"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
