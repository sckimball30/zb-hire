'use client'

import { cn } from '@/lib/utils'
import type { Rating } from '@/types'

interface RatingSelectProps {
  value: Rating | null
  onChange: (rating: Rating | null) => void
  size?: 'sm' | 'lg'
}

const RATINGS: Array<{ value: Rating; label: string; short: string; activeClass: string; hoverClass: string }> = [
  {
    value: 'STRONG_NO',
    label: 'Strong No',
    short: 'SN',
    activeClass: 'bg-red-600 text-white border-red-600',
    hoverClass: 'hover:bg-red-50 hover:border-red-300',
  },
  {
    value: 'NO',
    label: 'No',
    short: 'N',
    activeClass: 'bg-red-300 text-red-900 border-red-300',
    hoverClass: 'hover:bg-red-50 hover:border-red-200',
  },
  {
    value: 'NEUTRAL',
    label: 'Neutral',
    short: '–',
    activeClass: 'bg-gray-300 text-gray-900 border-gray-300',
    hoverClass: 'hover:bg-gray-100 hover:border-gray-300',
  },
  {
    value: 'YES',
    label: 'Yes',
    short: 'Y',
    activeClass: 'bg-green-300 text-green-900 border-green-300',
    hoverClass: 'hover:bg-green-50 hover:border-green-200',
  },
  {
    value: 'STRONG_YES',
    label: 'Strong Yes',
    short: 'SY',
    activeClass: 'bg-green-600 text-white border-green-600',
    hoverClass: 'hover:bg-green-50 hover:border-green-300',
  },
]

export function RatingSelect({ value, onChange, size = 'sm' }: RatingSelectProps) {
  const isLg = size === 'lg'

  return (
    <div className="flex items-center gap-1.5">
      {RATINGS.map((rating) => {
        const isSelected = value === rating.value
        return (
          <button
            key={rating.value}
            type="button"
            onClick={() => onChange(isSelected ? null : rating.value)}
            className={cn(
              'border rounded-md font-medium transition-all',
              isLg ? 'px-3 py-1.5 text-sm min-w-[72px]' : 'px-2 py-1 text-xs min-w-[44px]',
              isSelected
                ? rating.activeClass
                : cn('bg-white text-gray-600 border-gray-200', rating.hoverClass)
            )}
            title={rating.label}
          >
            {isLg ? rating.label : rating.short}
          </button>
        )
      })}
    </div>
  )
}
