'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  text: string
  guidance?: string | null
  category: string
  tags?: string | null
  isStandard: boolean
  aPlayerAnswer?: string | null
  bPlayerAnswer?: string | null
  cPlayerAnswer?: string | null
}

interface QuestionRowProps {
  question: Question
  categoryBadge: React.ReactNode
  deleteButton?: React.ReactNode
}

export function QuestionRow({ question, categoryBadge, deleteButton }: QuestionRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasGuide = question.aPlayerAnswer || question.bPlayerAnswer || question.cPlayerAnswer

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => hasGuide && setExpanded(e => !e)}
      >
        <td>
          <div className="max-w-lg flex items-start gap-2">
            {hasGuide && (
              <span className="mt-0.5 flex-shrink-0 text-gray-400">
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-900 font-medium">{question.text}</p>
                {question.isStandard && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 flex-shrink-0">
                    Wigglitz Standard
                  </span>
                )}
              </div>
              {question.guidance && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{question.guidance}</p>
              )}
            </div>
          </div>
        </td>
        <td>{categoryBadge}</td>
        <td>
          <div className="flex items-center justify-between gap-2">
            <div>
              {question.tags ? (
                <div className="flex flex-wrap gap-1">
                  {question.tags.split(',').map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
            {deleteButton && <div onClick={e => e.stopPropagation()}>{deleteButton}</div>}
          </div>
        </td>
      </tr>
      {expanded && hasGuide && (
        <tr>
          <td colSpan={3} className="pb-4 pt-0 px-4">
            <div className="grid grid-cols-3 gap-3 mt-1 ml-5">
              {question.aPlayerAnswer && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-semibold text-green-700 mb-1.5">A Player</p>
                  <p className="text-xs text-green-900 leading-relaxed">{question.aPlayerAnswer}</p>
                </div>
              )}
              {question.bPlayerAnswer && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1.5">B Player</p>
                  <p className="text-xs text-amber-900 leading-relaxed">{question.bPlayerAnswer}</p>
                </div>
              )}
              {question.cPlayerAnswer && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1.5">C Player</p>
                  <p className="text-xs text-red-900 leading-relaxed">{question.cPlayerAnswer}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
