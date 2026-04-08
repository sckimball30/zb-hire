'use client'

import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { TransferJobModal } from './TransferJobModal'

interface Props {
  applicationId: string
  currentJobId: string
  currentJobTitle: string
  candidateName: string
}

export function TransferJobButton({ applicationId, currentJobId, currentJobTitle, candidateName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline text-xs flex items-center gap-1.5"
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        Move to Role
      </button>

      {open && (
        <TransferJobModal
          applicationId={applicationId}
          currentJobId={currentJobId}
          currentJobTitle={currentJobTitle}
          candidateName={candidateName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
