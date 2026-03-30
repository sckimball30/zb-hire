'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function JobTabNav({ jobId }: { jobId: string }) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Overview', href: `/jobs/${jobId}` },
    { label: 'Pipeline', href: `/jobs/${jobId}/pipeline` },
    { label: 'Team', href: `/jobs/${jobId}/team` },
  ]

  return (
    <div className="flex gap-0 mt-4 -mb-px">
      {tabs.map(tab => {
        // Active logic: exact match for overview, startsWith for others
        const isOverview = tab.href === `/jobs/${jobId}` && (pathname === `/jobs/${jobId}` || pathname === `/jobs/${jobId}/`)
        const isOther = tab.href !== `/jobs/${jobId}` && pathname.startsWith(tab.href)
        const active = isOverview || isOther

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              active
                ? 'border-[#111] text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
