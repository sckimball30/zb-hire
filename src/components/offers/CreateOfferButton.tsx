'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateOfferModal } from './CreateOfferModal'

interface Props {
  applicationId: string
  jobTitle: string
}

export function CreateOfferButton({ applicationId, jobTitle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-xs"
      >
        <Plus className="w-3 h-3" />
        Create Offer
      </button>

      {open && (
        <CreateOfferModal
          applicationId={applicationId}
          jobTitle={jobTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
