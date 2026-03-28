'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useCallback, Suspense } from 'react'

interface SearchInputProps {
  placeholder?: string
  defaultValue?: string
}

function SearchInputInner({ placeholder = 'Search...', defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (e.target.value) {
        params.set('q', e.target.value)
      } else {
        params.delete('q')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        className="input pl-9 w-64"
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={handleChange}
      />
    </div>
  )
}

export function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" className="input pl-9 w-64" placeholder={props.placeholder ?? 'Search...'} defaultValue={props.defaultValue ?? ''} readOnly />
      </div>
    }>
      <SearchInputInner {...props} />
    </Suspense>
  )
}
