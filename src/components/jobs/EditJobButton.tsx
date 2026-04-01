'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { EditJobModal } from './EditJobModal'

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

export function EditJobButton({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline flex items-center gap-2">
        <Edit2 className="w-4 h-4" />
        Edit Job
      </button>
      {open && <EditJobModal job={job} onClose={() => setOpen(false)} />}
    </>
  )
}
