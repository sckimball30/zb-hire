'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, FileText } from 'lucide-react'
import { cn, initials } from '@/lib/utils'
import { StarRating } from '@/components/shared/StarRating'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ApplicationWithRelations } from '@/types'

interface CandidateCardProps {
  application: ApplicationWithRelations
  isDragging?: boolean
}

export function CandidateCard({ application, isDragging = false }: CandidateCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: application.id })

  const [starRating, setStarRating] = useState<number | null>(application.starRating ?? null)

  const style = { transform: CSS.Transform.toString(transform), transition }
  const { candidate } = application
  const scorecardCount = (application as any)._count?.scorecards ?? 0
  const daysInStage = Math.floor(
    (Date.now() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  async function handleStarChange(rating: number | null) {
    setStarRating(rating)
    const res = await fetch(`/api/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starRating: rating }),
    })
    if (!res.ok) {
      setStarRating(application.starRating ?? null)
      toast.error('Failed to update rating.')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-pointer select-none',
        'hover:shadow-md hover:border-blue-200 transition-all',
        isSortableDragging && 'opacity-40',
        isDragging && 'shadow-xl border-blue-300'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mt-0.5 p-0.5 rounded"
          onClick={e => e.preventDefault()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0">
              {initials(candidate.firstName, candidate.lastName)}
            </div>
            <Link
              href={`/applications/${application.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate leading-tight"
              onClick={e => e.stopPropagation()}
            >
              {candidate.firstName} {candidate.lastName}
            </Link>
          </div>

          <StarRating value={starRating} onChange={handleStarChange} size="sm" />

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-400">
              {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
            </span>
            {scorecardCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <FileText className="w-3 h-3" />
                {scorecardCount}
              </span>
            )}
          </div>

          {candidate.source && (
            <div className="mt-1">
              <span className="text-xs text-gray-400">{candidate.source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
