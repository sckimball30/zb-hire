'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, X } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  INTERVIEWER:    'Interviewer',
  RECRUITER:      'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
}

export function PreviewBanner() {
  const [previewRole, setPreviewRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const match = document.cookie.match(/zbhire_preview_role=([^;]+)/)
    setPreviewRole(match ? match[1] : null)
  }, [])

  // Re-check cookie on focus (in case sidebar changes it)
  useEffect(() => {
    const handler = () => {
      const match = document.cookie.match(/zbhire_preview_role=([^;]+)/)
      setPreviewRole(match ? match[1] : null)
    }
    window.addEventListener('focus', handler)
    window.addEventListener('zbhire_preview_changed', handler)
    return () => {
      window.removeEventListener('focus', handler)
      window.removeEventListener('zbhire_preview_changed', handler)
    }
  }, [])

  if (!previewRole) return null

  const exit = async () => {
    await fetch('/api/preview', { method: 'DELETE' })
    setPreviewRole(null)
    window.dispatchEvent(new Event('zbhire_preview_changed'))
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>Previewing as {ROLE_LABELS[previewRole] ?? previewRole}</span>
      <button
        onClick={exit}
        className="ml-1 flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-full px-2.5 py-0.5 transition-colors text-xs font-bold"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  )
}
