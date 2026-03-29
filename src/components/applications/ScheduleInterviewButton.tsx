'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
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
}

export function ScheduleInterviewButton({ applicationId, interviewers }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline text-xs"
      >
        <Calendar className="w-3 h-3" />
        Schedule Interview
      </button>

      {open && (
        <ScheduleInterviewModal
          applicationId={applicationId}
          interviewers={interviewers}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
