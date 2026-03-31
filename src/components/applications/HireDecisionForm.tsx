'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface HireDecisionFormProps {
  applicationId: string
  onClose: () => void
}

type ABC = 'A' | 'B' | 'C' | null

function ABCSelect({ value, onChange }: { value: ABC; onChange: (v: ABC) => void }) {
  const options: { val: ABC; label: string; activeClass: string }[] = [
    { val: 'A', label: 'A', activeClass: 'bg-green-600 text-white border-green-600' },
    { val: 'B', label: 'B', activeClass: 'bg-amber-400 text-white border-amber-400' },
    { val: 'C', label: 'C', activeClass: 'bg-red-600 text-white border-red-600' },
  ]
  return (
    <div className="flex items-center gap-1.5">
      {options.map(opt => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onChange(value === opt.val ? null : opt.val)}
          className={`px-3 py-1.5 text-sm font-semibold border rounded-md transition-all ${
            value === opt.val
              ? opt.activeClass
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function YesNoSelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {['Yes', 'No'].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? null : opt)}
          className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-all ${
            value === opt
              ? opt === 'Yes'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function RatingRow({ label, value, onChange }: { label: string; value: ABC; onChange: (v: ABC) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <ABCSelect value={value} onChange={onChange} />
    </div>
  )
}

function GutCheckRow({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <YesNoSelect value={value} onChange={onChange} />
    </div>
  )
}

export function HireDecisionForm({ applicationId, onClose }: HireDecisionFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [interviewerName, setInterviewerName] = useState('')

  // Outcomes
  const [outcomesMatch, setOutcomesMatch] = useState<ABC>(null)
  const [resultsOrientation, setResultsOrientation] = useState<ABC>(null)

  // Core Values
  const [fierceOwnership, setFierceOwnership] = useState<ABC>(null)
  const [decisiveAction, setDecisiveAction] = useState<ABC>(null)
  const [mentalToughness, setMentalToughness] = useState<ABC>(null)
  const [competitiveExcellence, setCompetitiveExcellence] = useState<ABC>(null)

  // Role Fit
  const [roleSpecificFit, setRoleSpecificFit] = useState<ABC>(null)
  const [whoInterviewPattern, setWhoInterviewPattern] = useState<ABC>(null)
  const [referenceCheck, setReferenceCheck] = useState<ABC>(null)

  // Gut Check
  const [gutCheckThrilled, setGutCheckThrilled] = useState<string | null>(null)
  const [gutCheckTeam, setGutCheckTeam] = useState<string | null>(null)
  const [gutCheckEmbarrassed, setGutCheckEmbarrassed] = useState<string | null>(null)

  // Overall
  const [overallRating, setOverallRating] = useState<ABC>(null)
  const [rationale, setRationale] = useState('')
  const [recommendation, setRecommendation] = useState<'HIRE' | 'NO HIRE' | null>(null)

  const handleSubmit = async () => {
    if (!recommendation) {
      toast.error('Please select HIRE or NO HIRE before submitting')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/hire-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerName: interviewerName || undefined,
          outcomesMatch,
          resultsOrientation,
          fierceOwnership,
          decisiveAction,
          mentalToughness,
          competitiveExcellence,
          roleSpecificFit,
          whoInterviewPattern,
          referenceCheck,
          gutCheckThrilled,
          gutCheckTeam,
          gutCheckEmbarrassed,
          overallRating,
          rationale: rationale || null,
          recommendation,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit evaluation')
      toast.success('Evaluation submitted')
      onClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Submit My Evaluation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Interviewer */}
          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              placeholder="Enter your name..."
              value={interviewerName}
              onChange={e => setInterviewerName(e.target.value)}
            />
          </div>

          {/* OUTCOMES */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Outcomes</h3>
            <div className="card p-3">
              <RatingRow label="Outcomes Match" value={outcomesMatch} onChange={setOutcomesMatch} />
              <RatingRow label="Results Orientation" value={resultsOrientation} onChange={setResultsOrientation} />
            </div>
          </div>

          {/* CORE VALUES */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Core Values</h3>
            <div className="card p-3">
              <RatingRow label="Fierce Ownership" value={fierceOwnership} onChange={setFierceOwnership} />
              <RatingRow label="Decisive Action" value={decisiveAction} onChange={setDecisiveAction} />
              <RatingRow label="Mental Toughness" value={mentalToughness} onChange={setMentalToughness} />
              <RatingRow label="Competitive Excellence" value={competitiveExcellence} onChange={setCompetitiveExcellence} />
            </div>
          </div>

          {/* ROLE FIT */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Fit</h3>
            <div className="card p-3">
              <RatingRow label="Role-Specific Competencies" value={roleSpecificFit} onChange={setRoleSpecificFit} />
              <RatingRow label="WHO Interview Pattern" value={whoInterviewPattern} onChange={setWhoInterviewPattern} />
              <RatingRow label="Reference Check" value={referenceCheck} onChange={setReferenceCheck} />
            </div>
          </div>

          {/* GUT CHECK */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gut Check</h3>
            <div className="card p-3">
              <GutCheckRow
                label="Would you be thrilled to work with this person every day?"
                value={gutCheckThrilled}
                onChange={setGutCheckThrilled}
              />
              <GutCheckRow
                label="Would this person make the team better?"
                value={gutCheckTeam}
                onChange={setGutCheckTeam}
              />
              <GutCheckRow
                label="Would you be embarrassed if this person joined and underperformed?"
                value={gutCheckEmbarrassed}
                onChange={setGutCheckEmbarrassed}
              />
            </div>
          </div>

          {/* OVERALL */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overall</h3>
            <div className="card p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Overall Rating</span>
                <ABCSelect value={overallRating} onChange={setOverallRating} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Rationale</label>
                <textarea
                  className="input h-auto text-sm"
                  rows={3}
                  placeholder="Summarize your assessment..."
                  value={rationale}
                  onChange={e => setRationale(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* RECOMMENDATION */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommendation</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRecommendation(recommendation === 'HIRE' ? null : 'HIRE')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg border-2 transition-all ${
                  recommendation === 'HIRE'
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                }`}
              >
                HIRE
              </button>
              <button
                type="button"
                onClick={() => setRecommendation(recommendation === 'NO HIRE' ? null : 'NO HIRE')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg border-2 transition-all ${
                  recommendation === 'NO HIRE'
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                }`}
              >
                NO HIRE
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
            <button
              onClick={onClose}
              className="btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
