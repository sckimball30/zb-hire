'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, ALL_STAGES } from '@/lib/constants'
import type { CandidateStage } from '@/types'

interface StageSelectorProps {
  applicationId: string
  currentStage: CandidateStage
}

export function StageSelector({ applicationId, currentStage }: StageSelectorProps) {
  const router = useRouter()
  const [stage, setStage] = useState(currentStage)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleStageChange = async (newStage: CandidateStage) => {
    if (newStage === stage) {
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update stage')
      }

      setStage(newStage)
      toast.success(`Stage updated to ${STAGE_LABELS[newStage]}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update stage')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${STAGE_COLORS[stage]} cursor-pointer border-2 border-transparent hover:border-current transition-colors`}
      >
        {loading ? 'Updating...' : STAGE_LABELS[stage]}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            {ALL_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${s === stage ? 'font-medium' : ''}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${STAGE_COLORS[s].split(' ')[0]}`} />
                {STAGE_LABELS[s]}
                {s === stage && <span className="ml-auto text-blue-600">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
