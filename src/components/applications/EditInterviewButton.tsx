'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { ScheduleInterviewModal } from './ScheduleInterviewModal'

interface Interviewer {
  id: string
  name: string
  title: string | null
  calendlyUrl: string | null
}

interface Props {
  applicationId: string
  interviewers: Interviewer[]
  event: {
    id: string
    interviewerId: string | null
    type: string
    scheduledAt: string | null
    durationMins: number
    location: string | null
    notes: string | null
  }
}

export function EditInterviewButton({ applicationId, interviewers, event }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit interview"
        className="ml-auto flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Pencil className="w-3 h-3" />
      </button>

      {open && (
        <ScheduleInterviewModal
          applicationId={applicationId}
          interviewers={interviewers}
          existingEvent={event}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
