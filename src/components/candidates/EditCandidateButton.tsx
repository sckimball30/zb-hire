'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { EditCandidateModal } from './EditCandidateModal'

interface CandidateData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  linkedInUrl: string | null
  source: string | null
  notes: string | null
}

interface Props {
  candidate: CandidateData
}

export function EditCandidateButton({ candidate }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline text-xs flex items-center gap-1.5"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>

      {open && (
        <EditCandidateModal
          candidate={candidate}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
