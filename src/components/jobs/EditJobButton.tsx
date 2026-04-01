'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { EditJobModal } from './EditJobModal'
import { JobSetupChecklist } from './JobSetupChecklist'

interface Job {
  id: string
  title: string
  department: string | null
  location: string | null
  description: string | null
  status: string
  employmentType: string | null
  payType: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  hiringGoal: number | null
  interviewCount: number
}

interface Props {
  job: Job
  // Checklist props — pass these to wire checklist "Edit Job" links to the same modal
  checklistProps?: {
    hasInterviewers: boolean
    hasScorecardTemplate: boolean
    isOpen: boolean
    hasDescription: boolean
  }
}

export function EditJobButton({ job, checklistProps }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline flex items-center gap-2">
        <Edit2 className="w-4 h-4" />
        Edit Job
      </button>

      {/* If checklist props provided, render checklist here so it shares the same modal */}
      {checklistProps && (
        <div className="hidden" id="checklist-slot" />
      )}

      {open && <EditJobModal job={job} onClose={() => setOpen(false)} />}
    </>
  )
}

// Separate component for use in the overview page body
// (renders checklist + modal together, sharing state)
export function JobOverviewEditSection({
  job,
  hasInterviewers,
  hasScorecardTemplate,
  isOpen,
  hasDescription,
}: {
  job: Job
  hasInterviewers: boolean
  hasScorecardTemplate: boolean
  isOpen: boolean
  hasDescription: boolean
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Edit button in header */}
      <button onClick={() => setModalOpen(true)} className="btn-outline flex items-center gap-2">
        <Edit2 className="w-4 h-4" />
        Edit Job
      </button>

      {/* Checklist — "Edit Job" links open the same modal */}
      <div className="mb-6 mt-6">
        <JobSetupChecklist
          jobId={job.id}
          hasInterviewers={hasInterviewers}
          hasScorecardTemplate={hasScorecardTemplate}
          isOpen={isOpen}
          hasDescription={hasDescription}
          onEditClick={() => setModalOpen(true)}
        />
      </div>

      {modalOpen && <EditJobModal job={job} onClose={() => setModalOpen(false)} />}
    </>
  )
}
