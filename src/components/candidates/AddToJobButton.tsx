'use client'

import { useState } from 'react'
import { Briefcase } from 'lucide-react'
import { AddToJobModal } from './AddToJobModal'

interface Props {
  candidateId: string
  candidateName: string
  existingJobIds: string[]
}

export function AddToJobButton({ candidateId, candidateName, existingJobIds }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline text-xs flex items-center gap-1.5"
      >
        <Briefcase className="w-3.5 h-3.5" />
        Add to Job
      </button>

      {open && (
        <AddToJobModal
          candidateId={candidateId}
          candidateName={candidateName}
          existingJobIds={existingJobIds}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
