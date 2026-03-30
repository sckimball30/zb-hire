'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'

interface Job { id: string; title: string }

interface Props {
  jobs: Job[]
  currentQ: string
  currentJobId: string
  currentDateFrom: string
  currentDateTo: string
}

export function CandidateFilters({ jobs, currentQ, currentJobId, currentDateFrom, currentDateTo }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const clearAll = () => router.replace(pathname)
  const hasFilters = currentQ || currentJobId || currentDateFrom || currentDateTo

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Name search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search name or email…"
          defaultValue={currentQ}
          onChange={e => update('q', e.target.value)}
          className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4AFFD2]/40 focus:border-[#4AFFD2] w-56"
        />
      </div>

      {/* Role filter */}
      <select
        value={currentJobId}
        onChange={e => update('jobId', e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4AFFD2]/40 focus:border-[#4AFFD2] bg-white text-gray-700"
      >
        <option value="">All roles</option>
        {jobs.map(j => (
          <option key={j.id} value={j.id}>{j.title}</option>
        ))}
      </select>

      {/* Date from */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 whitespace-nowrap">Applied from</span>
        <input
          type="date"
          value={currentDateFrom}
          onChange={e => update('dateFrom', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4AFFD2]/40 focus:border-[#4AFFD2]"
        />
      </div>

      {/* Date to */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">to</span>
        <input
          type="date"
          value={currentDateTo}
          onChange={e => update('dateTo', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4AFFD2]/40 focus:border-[#4AFFD2]"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Clear filters
        </button>
      )}
    </div>
  )
}
