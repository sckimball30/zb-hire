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

interface ScorecardSection {
  id: string
  title: string
}

interface Props {
  applicationId: string
  interviewers: Interviewer[]
  sections?: ScorecardSection[]
  candidateId?: string
  candidateEmail?: string
  candidateFirstName?: string
  jobTitle?: string
}

export function ScheduleInterviewButton({
  applicationId,
  interviewers,
  sections,
  candidateId,
  candidateEmail,
  candidateFirstName,
  jobTitle,
}: Props) {
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
          sections={sections}
          candidateId={candidateId}
          candidateEmail={candidateEmail}
          candidateFirstName={candidateFirstName}
          jobTitle={jobTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
