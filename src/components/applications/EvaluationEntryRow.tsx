'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface EvaluationEntryRowProps {
  entry: {
    id: string
    interviewerName: string
    responses: string
    submittedAt?: string | null
  }
  questionMap: Record<string, string>
  canExpand: boolean
}

function ratingClass(r: string | null | undefined) {
  if (r === 'A') return 'bg-green-100 text-green-700'
  if (r === 'B') return 'bg-amber-100 text-amber-700'
  if (r === 'C') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

function recommendationClass(r: string | null | undefined) {
  if (r === 'HIRE') return 'bg-green-700 text-white'
  if (r === 'MAYBE') return 'bg-amber-500 text-white'
  if (r === 'NO HIRE') return 'bg-red-700 text-white'
  return 'bg-gray-100 text-gray-500'
}

export function EvaluationEntryRow({ entry, questionMap, canExpand }: EvaluationEntryRowProps) {
  const [expanded, setExpanded] = useState(false)

  let parsed: Record<string, any> = {}
  try { parsed = JSON.parse(entry.responses) } catch {}

  // Compute dominant rating
  const questionEntries = Object.entries(parsed).filter(([k]) => !k.startsWith('__'))
  const ratings = questionEntries.map(([, v]) => v?.rating).filter(Boolean) as string[]
  let dominantRating: string | null = null
  if (ratings.length) {
    const counts: Record<string, number> = {}
    for (const r of ratings) counts[r] = (counts[r] || 0) + 1
    dominantRating = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  const sectionNotes = parsed.__sectionNotes__ as string | null
  const gutCheck = parsed.__gutCheck__ as { thrilled?: string; team?: string; embarrassed?: string } | null
  const recommendation = parsed.__recommendation__ as string | null
  const customQuestions = parsed.__customQuestions__ as { id: string; text: string; rating: string | null; notes: string }[] | null

  const hasDetails = questionEntries.length > 0 || sectionNotes || gutCheck || recommendation || customQuestions?.length

  return (
    <li className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Header row */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 text-sm ${canExpand && hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => canExpand && hasDetails && setExpanded(e => !e)}
      >
        <span className="font-medium text-gray-800">{entry.interviewerName}</span>
        {dominantRating && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${ratingClass(dominantRating)}`}>
            {dominantRating} Player
          </span>
        )}
        {recommendation && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${recommendationClass(recommendation)}`}>
            {recommendation}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {entry.submittedAt
            ? new Date(entry.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : ''}
        </span>
        {canExpand && hasDetails && (
          expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">

          {/* Per-question responses */}
          {questionEntries.length > 0 && (
            <div className="space-y-2">
              {questionEntries.map(([qId, resp]) => {
                const qText = questionMap[qId] ?? null
                const hasContent = resp?.rating || resp?.notes
                if (!hasContent) return null
                return (
                  <div key={qId} className="text-xs">
                    {qText && (
                      <p className="text-gray-500 font-medium mb-0.5">{qText}</p>
                    )}
                    <div className="flex items-start gap-2">
                      {resp?.rating && (
                        <span className={`inline-flex items-center px-1.5 py-0 rounded text-xs font-bold flex-shrink-0 ${ratingClass(resp.rating)}`}>
                          {resp.rating}
                        </span>
                      )}
                      {resp?.notes && (
                        <p className="text-gray-600 leading-relaxed">{resp.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Custom questions */}
          {customQuestions && customQuestions.length > 0 && (
            <div className="space-y-2">
              {customQuestions.map((cq) => (
                <div key={cq.id} className="text-xs">
                  <p className="text-gray-500 font-medium mb-0.5">{cq.text}</p>
                  <div className="flex items-start gap-2">
                    {cq.rating && (
                      <span className={`inline-flex items-center px-1.5 py-0 rounded text-xs font-bold flex-shrink-0 ${ratingClass(cq.rating)}`}>
                        {cq.rating}
                      </span>
                    )}
                    {cq.notes && <p className="text-gray-600 leading-relaxed">{cq.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section notes */}
          {sectionNotes && (
            <div className="text-xs">
              <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Notes</p>
              <p className="text-gray-600">{sectionNotes}</p>
            </div>
          )}

          {/* Gut check */}
          {gutCheck && (gutCheck.thrilled || gutCheck.team || gutCheck.embarrassed) && (
            <div className="text-xs">
              <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Gut Check</p>
              <div className="space-y-1">
                {gutCheck.thrilled && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Thrilled to work with?</span>
                    <span className={`font-medium ${gutCheck.thrilled === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{gutCheck.thrilled}</span>
                  </div>
                )}
                {gutCheck.team && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Makes team better?</span>
                    <span className={`font-medium ${gutCheck.team === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{gutCheck.team}</span>
                  </div>
                )}
                {gutCheck.embarrassed && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Confident they get it done?</span>
                    <span className={`font-medium ${gutCheck.embarrassed === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{gutCheck.embarrassed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
