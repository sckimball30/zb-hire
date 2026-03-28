import { cn } from '@/lib/utils'
import {
  STAGE_COLORS,
  RATING_COLORS,
  CATEGORY_COLORS,
  JOB_STATUS_COLORS,
  STAGE_LABELS,
  RATING_LABELS,
  CATEGORY_LABELS,
  JOB_STATUS_LABELS,
} from '@/lib/constants'
import type { CandidateStage, Rating, CompetencyCategory, JobStatus } from '@/types'

type BadgeVariant =
  | { type: 'stage'; value: CandidateStage }
  | { type: 'rating'; value: Rating }
  | { type: 'category'; value: CompetencyCategory }
  | { type: 'jobStatus'; value: JobStatus }
  | { type: 'custom'; label: string; className: string }

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

export function Badge({ variant, className }: BadgeProps) {
  let label = ''
  let colorClass = ''

  if (variant.type === 'stage') {
    label = STAGE_LABELS[variant.value]
    colorClass = STAGE_COLORS[variant.value]
  } else if (variant.type === 'rating') {
    label = RATING_LABELS[variant.value]
    colorClass = RATING_COLORS[variant.value]
  } else if (variant.type === 'category') {
    label = CATEGORY_LABELS[variant.value]
    colorClass = CATEGORY_COLORS[variant.value]
  } else if (variant.type === 'jobStatus') {
    label = JOB_STATUS_LABELS[variant.value]
    colorClass = JOB_STATUS_COLORS[variant.value]
  } else {
    label = variant.label
    colorClass = variant.className
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
