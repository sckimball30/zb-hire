'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

interface ChecklistProps {
  jobId: string
  hasInterviewers: boolean
  hasScorecardTemplate: boolean
  isOpen: boolean
  hasDescription: boolean
}

interface CheckItem {
  label: string
  done: boolean
  hint: string
  action?: { label: string; href: string }
}

export function JobSetupChecklist({ jobId, hasInterviewers, hasScorecardTemplate, isOpen, hasDescription }: ChecklistProps) {
  const items: CheckItem[] = [
    {
      label: 'Write the job description',
      done: hasDescription,
      hint: 'Help candidates understand the role.',
      action: { label: 'Edit Job', href: `/jobs/${jobId}/edit` },
    },
    {
      label: 'Assign interviewers',
      done: hasInterviewers,
      hint: 'Add the people who will be interviewing for this role.',
      action: { label: 'Go to Team tab', href: `/jobs/${jobId}/team` },
    },
    {
      label: 'Build a scorecard template',
      done: hasScorecardTemplate,
      hint: 'Define the questions interviewers will use to evaluate candidates.',
      // action is scroll-to on same page — handled via hint text
    },
    {
      label: 'Open the job to applicants',
      done: isOpen,
      hint: 'Change the job status to Open so candidates can apply.',
      action: { label: 'Edit Job', href: `/jobs/${jobId}/edit` },
    },
  ]

  const doneCount = items.filter(i => i.done).length
  const allDone = doneCount === items.length

  if (allDone) return null

  return (
    <div className="card p-5 border-l-4 border-l-[#4AFFD2]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Job Setup</h3>
        <span className="text-xs text-gray-400">{doneCount} / {items.length} complete</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#4AFFD2] rounded-full transition-all"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2.5 ${item.done ? 'opacity-50' : ''}`}>
            {item.done
              ? <CheckCircle2 className="w-4 h-4 text-[#4AFFD2] flex-shrink-0 mt-0.5" />
              : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.label}
              </p>
              {!item.done && (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">{item.hint}</p>
                  {item.action && (
                    <Link
                      href={item.action.href}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 flex-shrink-0"
                    >
                      {item.action.label}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
