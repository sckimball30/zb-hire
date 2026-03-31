'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { HireDecisionForm } from './HireDecisionForm'

interface HireDecision {
  id: string
  interviewerName?: string | null
  outcomesMatch?: string | null
  resultsOrientation?: string | null
  fierceOwnership?: string | null
  decisiveAction?: string | null
  mentalToughness?: string | null
  competitiveExcellence?: string | null
  roleSpecificFit?: string | null
  whoInterviewPattern?: string | null
  referenceCheck?: string | null
  gutCheckThrilled?: string | null
  gutCheckTeam?: string | null
  gutCheckEmbarrassed?: string | null
  overallRating?: string | null
  rationale?: string | null
  recommendation?: string | null
  submittedAt?: Date | string | null
  createdAt: Date | string
}

interface HireDecisionPanelProps {
  applicationId: string
  decisions: HireDecision[]
}

function RatingBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-gray-300">—</span>
  const colorMap: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-amber-100 text-amber-700',
    C: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorMap[value] ?? 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  )
}

function RecommendationBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-gray-400 text-xs">Pending</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
      value === 'HIRE' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
    }`}>
      {value}
    </span>
  )
}

function DecisionCard({ d }: { d: HireDecision }) {
  const [expanded, setExpanded] = useState(false)

  const outcomeRows = [
    { label: 'Outcomes Match', value: d.outcomesMatch },
    { label: 'Results Orientation', value: d.resultsOrientation },
  ]
  const coreRows = [
    { label: 'Fierce Ownership', value: d.fierceOwnership },
    { label: 'Decisive Action', value: d.decisiveAction },
    { label: 'Mental Toughness', value: d.mentalToughness },
    { label: 'Competitive Excellence', value: d.competitiveExcellence },
  ]
  const roleFitRows = [
    { label: 'Role-Specific Competencies', value: d.roleSpecificFit },
    { label: 'WHO Interview Pattern', value: d.whoInterviewPattern },
    { label: 'Reference Check', value: d.referenceCheck },
  ]
  const gutCheckRows = [
    { label: 'Would be thrilled to work with', value: d.gutCheckThrilled },
    { label: 'Would make team better', value: d.gutCheckTeam },
    { label: 'Embarrassed if underperformed', value: d.gutCheckEmbarrassed },
  ]

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900 text-sm">
            {d.interviewerName || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {d.submittedAt
              ? `Submitted ${new Date(d.submittedAt).toLocaleDateString()}`
              : `Started ${new Date(d.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d.overallRating && (
            <span className="text-xs text-gray-500">Overall: <RatingBadge value={d.overallRating} /></span>
          )}
          <RecommendationBadge value={d.recommendation} />
        </div>
      </div>

      {d.rationale && (
        <p className="text-sm text-gray-600 mb-3 italic">"{d.rationale}"</p>
      )}

      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="text-xs text-blue-600 hover:text-blue-700"
      >
        {expanded ? 'Hide details' : 'Show details'}
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Outcomes</p>
            {outcomeRows.map(r => (
              <div key={r.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-600">{r.label}</span>
                <RatingBadge value={r.value} />
              </div>
            ))}
            <p className="font-semibold text-gray-500 mb-1.5 uppercase tracking-wider mt-3">Role Fit</p>
            {roleFitRows.map(r => (
              <div key={r.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-600">{r.label}</span>
                <RatingBadge value={r.value} />
              </div>
            ))}
          </div>
          <div>
            <p className="font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Core Values</p>
            {coreRows.map(r => (
              <div key={r.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-600">{r.label}</span>
                <RatingBadge value={r.value} />
              </div>
            ))}
            <p className="font-semibold text-gray-500 mb-1.5 uppercase tracking-wider mt-3">Gut Check</p>
            {gutCheckRows.map(r => (
              <div key={r.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-600">{r.label}</span>
                <span className={`font-medium ${r.value === 'Yes' ? 'text-green-600' : r.value === 'No' ? 'text-red-600' : 'text-gray-300'}`}>
                  {r.value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function HireDecisionPanel({ applicationId, decisions }: HireDecisionPanelProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Hire Decisions ({decisions.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-outline text-xs flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          Submit My Evaluation
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-500">
          No evaluations submitted yet.{' '}
          <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">
            Be the first.
          </button>
        </div>
      ) : (
        <div className="px-6 py-4 space-y-4">
          {decisions.map(d => (
            <DecisionCard key={d.id} d={d} />
          ))}
        </div>
      )}

      {showForm && (
        <HireDecisionForm
          applicationId={applicationId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
