'use client'

import { useState } from 'react'
import { Ban, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  candidateId: string
  blocked: boolean
}

export function BlockCandidateButton({ candidateId, blocked: initialBlocked }: Props) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const next = !blocked
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: next }),
    })
    setLoading(false)
    if (res.ok) {
      setBlocked(next)
      toast[next ? 'warning' : 'success'](
        next
          ? 'Candidate marked Do Not Contact. Their inbox thread is now hidden.'
          : 'Do Not Contact flag removed.'
      )
      router.refresh()
    } else {
      toast.error('Failed to update candidate status.')
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={blocked ? 'Remove Do Not Contact flag' : 'Mark as Do Not Contact'}
      className={`btn-outline text-xs flex items-center gap-1.5 ${
        blocked
          ? 'border-red-300 text-red-600 hover:bg-red-50'
          : 'text-gray-500 hover:text-red-600 hover:border-red-300'
      }`}
    >
      {blocked ? (
        <>
          <CheckCircle className="w-3.5 h-3.5" />
          Remove Block
        </>
      ) : (
        <>
          <Ban className="w-3.5 h-3.5" />
          Block
        </>
      )}
    </button>
  )
}
