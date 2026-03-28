'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (rating: number | null) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = (hover ?? value ?? 0) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => {
              if (readonly || !onChange) return
              onChange(value === star ? null : star)
            }}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(null)}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              className={cn(
                iconSize,
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
