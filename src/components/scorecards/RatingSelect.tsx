'use client'

import { cn } from '@/lib/utils'
import type { Rating } from '@/types'

interface RatingSelectProps {
  value: string | null
  onChange: (rating: string | null) => void
  size?: 'sm' | 'lg'
  mode?: 'abc' | 'full'
}

const ABC_RATINGS: Array<{ value: string; label: string; activeClass: string; hoverClass: string }> = [
  {
    value: 'A',
    label: 'A',
    activeClass: 'bg-green-600 text-white border-green-600',
    hoverClass: 'hover:bg-green-50 hover:border-green-300',
  },
  {
    value: 'B',
    label: 'B',
    activeClass: 'bg-amber-400 text-white border-amber-400',
    hoverClass: 'hover:bg-amber-50 hover:border-amber-300',
  },
  {
    value: 'C',
    label: 'C',
    activeClass: 'bg-red-600 text-white border-red-600',
    hoverClass: 'hover:bg-red-50 hover:border-red-300',
  },
]

const FULL_RATINGS: Array<{ value: string; label: string; short: string; activeClass: string; hoverClass: string }> = [
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

export function RatingSelect({ value, onChange, size = 'sm', mode = 'abc' }: RatingSelectProps) {
  const isLg = size === 'lg'
  const ratings = mode === 'full' ? FULL_RATINGS : ABC_RATINGS

  return (
    <div className="flex items-center gap-1.5">
      {ratings.map((rating) => {
        const isSelected = value === rating.value
        const showFull = mode === 'full'
        return (
          <button
            key={rating.value}
            type="button"
            onClick={() => onChange(isSelected ? null : rating.value)}
            className={cn(
              'border rounded-md font-bold transition-all',
              mode === 'full'
                ? isLg ? 'px-3 py-1.5 text-sm min-w-[72px]' : 'px-2 py-1 text-xs min-w-[44px]'
                : isLg ? 'px-4 py-1.5 text-base min-w-[52px]' : 'px-2.5 py-1 text-sm min-w-[36px]',
              isSelected
                ? rating.activeClass
                : cn('bg-white text-gray-600 border-gray-200', rating.hoverClass)
            )}
            title={mode === 'full' ? (rating as any).label : `${rating.label} Player`}
          >
            {mode === 'full' ? (isLg ? rating.label : (rating as any).short) : rating.label}
          </button>
        )
      })}
    </div>
  )
}
