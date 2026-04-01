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

export function JobSetupChecklist({ jobId, hasInterviewers, hasScorecardTemplate, isOpen, hasDescription }: ChecklistProps) {
  const items = [
    {
      label: 'Write the job description',
      done: hasDescription,
      hint: "Click 'Edit Job' above to add a description.",
    },
    {
      label: 'Assign interviewers',
      done: hasInterviewers,
      hint: 'Add the people who will be interviewing candidates.',
      href: `/jobs/${jobId}/team`,
      linkLabel: 'Go to Team tab',
    },
    {
      label: 'Build a scorecard template',
      done: hasScorecardTemplate,
      hint: 'Scroll down to the Scorecard Template section below.',
    },
    {
      label: 'Open the job to applicants',
      done: isOpen,
      hint: "Click 'Edit Job' above and set the status to Open.",
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
                  {'href' in item && item.href && (
                    <Link
                      href={item.href}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 flex-shrink-0"
                    >
                      {item.linkLabel}
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
