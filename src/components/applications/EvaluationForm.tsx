'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Question {
  id: string
  text: string
  guidance?: string | null
  aPlayerAnswer?: string | null
  bPlayerAnswer?: string | null
  cPlayerAnswer?: string | null
}

interface TemplateQuestion {
  id: string
  questionId: string
  required: boolean
  question: Question
}

interface TemplateSection {
  id: string
  title: string
  questions: TemplateQuestion[]
}

interface Interviewer {
  id: string
  name: string
  title?: string | null
}

interface EvaluationFormProps {
  applicationId: string
  interviewers: Interviewer[]
  template: { sections: TemplateSection[] } | null
}

type ABC = 'A' | 'B' | 'C' | null

function ABCButtons({ value, onChange, size = 'sm' }: { value: ABC; onChange: (v: ABC) => void; size?: 'sm' | 'lg' }) {
  const opts: { val: ABC; cls: string }[] = [
    { val: 'A', cls: 'bg-green-600 border-green-600 text-white' },
    { val: 'B', cls: 'bg-amber-400 border-amber-400 text-white' },
    { val: 'C', cls: 'bg-red-600 border-red-600 text-white' },
  ]
  const base = size === 'lg' ? 'px-5 py-2 text-base min-w-[52px]' : 'px-3 py-1.5 text-sm min-w-[36px]'
  return (
    <div className="flex items-center gap-1.5">
      {opts.map(o => (
        <button
          key={o.val}
          type="button"
          onClick={() => onChange(value === o.val ? null : o.val)}
          className={`${base} font-bold border rounded-md transition-all ${value === o.val ? o.cls : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
        >
          {o.val}
        </button>
      ))}
    </div>
  )
}

function YesNoButtons({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {['Yes', 'No'].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? null : opt)}
          className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-all ${
            value === opt
              ? opt === 'Yes' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function EvaluationForm({ applicationId, interviewers, template }: EvaluationFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Interviewer
  const [interviewerId, setInterviewerId] = useState(interviewers[0]?.id ?? '')

  // Template question responses
  const [responses, setResponses] = useState<Record<string, { rating: ABC; notes: string }>>({})

  // Core Values
  const [fierceOwnership, setFierceOwnership] = useState<ABC>(null)
  const [decisiveAction, setDecisiveAction] = useState<ABC>(null)
  const [mentalToughness, setMentalToughness] = useState<ABC>(null)
  const [competitiveExcellence, setCompetitiveExcellence] = useState<ABC>(null)

  // Gut Check
  const [gutCheckThrilled, setGutCheckThrilled] = useState<string | null>(null)
  const [gutCheckTeam, setGutCheckTeam] = useState<string | null>(null)
  const [gutCheckEmbarrassed, setGutCheckEmbarrassed] = useState<string | null>(null)

  // Overall
  const [overallRating, setOverallRating] = useState<ABC>(null)
  const [notes, setNotes] = useState('')
  const [recommendation, setRecommendation] = useState<'HIRE' | 'NO HIRE' | null>(null)

  const setResponse = (questionId: string, field: 'rating' | 'notes', value: ABC | string) => {
    setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], [field]: value } }))
  }

  const handleSubmit = async () => {
    if (!interviewerId) { toast.error('Please select an interviewer'); return }
    if (!recommendation) { toast.error('Please select HIRE or NO HIRE before submitting'); return }

    const interviewer = interviewers.find(i => i.id === interviewerId)

    setSubmitting(true)
    try {
      // 1. Create scorecard
      const createRes = await fetch(`/api/applications/${applicationId}/scorecards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerId }),
      })
      if (!createRes.ok) throw new Error('Failed to create evaluation')
      const scorecard = await createRes.json()

      // 2. Patch scorecard with responses + overall
      const allResponses = Object.entries(responses).map(([questionId, r]) => ({
        questionId,
        rating: r?.rating ?? null,
        notes: r?.notes ?? null,
      }))

      const patchRes = await fetch(`/api/applications/${applicationId}/scorecards/${scorecard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          summary: notes || null,
          recommendation,
          responses: allResponses,
          submittedAt: new Date().toISOString(),
        }),
      })
      if (!patchRes.ok) throw new Error('Failed to save evaluation')

      // 3. Create hire decision with core values + gut check
      await fetch(`/api/applications/${applicationId}/hire-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerName: interviewer?.name,
          fierceOwnership,
          decisiveAction,
          mentalToughness,
          competitiveExcellence,
          gutCheckThrilled,
          gutCheckTeam,
          gutCheckEmbarrassed,
          overallRating,
          rationale: notes || null,
          recommendation,
        }),
      })

      toast.success('Evaluation submitted!')
      router.push(`/applications/${applicationId}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* INTERVIEWER */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Who is submitting this evaluation?</h2>
        <select className="input" value={interviewerId} onChange={e => setInterviewerId(e.target.value)}>
          <option value="">Select your name…</option>
          {interviewers.map(i => (
            <option key={i.id} value={i.id}>{i.name}{i.title ? ` — ${i.title}` : ''}</option>
          ))}
        </select>
        {interviewers.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">No interviewers assigned to this job yet. Ask an admin to add you in the Team tab.</p>
        )}
      </div>

      {/* TEMPLATE QUESTIONS */}
      {template && template.sections.length > 0 ? (
        template.sections.map(section => (
          <div key={section.id} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {section.questions.map(tq => {
                const response = responses[tq.questionId] ?? { rating: null, notes: '' }
                const q = tq.question
                return (
                  <div key={tq.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {q.text}
                      {tq.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    {q.guidance && <p className="text-xs text-gray-400 italic mb-3">{q.guidance}</p>}

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Rating</label>
                        <ABCButtons value={response.rating} onChange={v => setResponse(tq.questionId, 'rating', v)} />
                      </div>

                      {/* Inline A/B/C guide */}
                      {(q.aPlayerAnswer || q.bPlayerAnswer || q.cPlayerAnswer) && (
                        <div className="grid grid-cols-3 gap-2">
                          {q.aPlayerAnswer && (
                            <div className="rounded border border-green-200 bg-green-50 p-2">
                              <p className="text-xs font-semibold text-green-700 mb-1">A Player</p>
                              <p className="text-xs text-green-900 leading-relaxed">{q.aPlayerAnswer}</p>
                            </div>
                          )}
                          {q.bPlayerAnswer && (
                            <div className="rounded border border-amber-200 bg-amber-50 p-2">
                              <p className="text-xs font-semibold text-amber-700 mb-1">B Player</p>
                              <p className="text-xs text-amber-900 leading-relaxed">{q.bPlayerAnswer}</p>
                            </div>
                          )}
                          {q.cPlayerAnswer && (
                            <div className="rounded border border-red-200 bg-red-50 p-2">
                              <p className="text-xs font-semibold text-red-700 mb-1">C Player</p>
                              <p className="text-xs text-red-900 leading-relaxed">{q.cPlayerAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <textarea
                        className="input h-auto text-sm"
                        rows={2}
                        placeholder="Notes on this question…"
                        value={response.notes ?? ''}
                        onChange={e => setResponse(tq.questionId, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="card p-5 border border-dashed border-gray-200">
          <p className="text-sm text-gray-400 italic text-center">No scorecard template set up for this job — only the core assessment below will be recorded.</p>
        </div>
      )}

      {/* CORE VALUES */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Core Values</h2>
        <p className="text-xs text-gray-400 mb-4">Rate this candidate on Wigglitz's four core values.</p>
        <div className="space-y-3">
          {[
            { label: 'Fierce Ownership', value: fierceOwnership, set: setFierceOwnership },
            { label: 'Decisive Action', value: decisiveAction, set: setDecisiveAction },
            { label: 'Mental Toughness', value: mentalToughness, set: setMentalToughness },
            { label: 'Competitive Excellence', value: competitiveExcellence, set: setCompetitiveExcellence },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{label}</span>
              <ABCButtons value={value} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* GUT CHECK */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Gut Check</h2>
        <div className="space-y-3">
          {[
            { label: 'Would you be thrilled to work with this person every day?', value: gutCheckThrilled, set: setGutCheckThrilled },
            { label: 'Would this person make the team better?', value: gutCheckTeam, set: setGutCheckTeam },
            { label: 'Would you be embarrassed if they joined and underperformed?', value: gutCheckEmbarrassed, set: setGutCheckEmbarrassed },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700 pr-4">{label}</span>
              <YesNoButtons value={value} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* OVERALL */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Overall Assessment</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 font-medium">Overall Rating</span>
          <ABCButtons value={overallRating} onChange={setOverallRating} size="lg" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Notes / Rationale</label>
          <textarea
            className="input h-auto"
            rows={3}
            placeholder="Summarize your overall impression…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* HIRE / NO HIRE */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Final Recommendation</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRecommendation(recommendation === 'HIRE' ? null : 'HIRE')}
            className={`py-4 text-base font-bold rounded-xl border-2 transition-all ${
              recommendation === 'HIRE'
                ? 'bg-green-700 text-white border-green-700 shadow-md'
                : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
            }`}
          >
            ✓ HIRE
          </button>
          <button
            type="button"
            onClick={() => setRecommendation(recommendation === 'NO HIRE' ? null : 'NO HIRE')}
            className={`py-4 text-base font-bold rounded-xl border-2 transition-all ${
              recommendation === 'NO HIRE'
                ? 'bg-red-700 text-white border-red-700 shadow-md'
                : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
            }`}
          >
            ✗ NO HIRE
          </button>
        </div>
      </div>

      {/* SUBMIT */}
      <div className="pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting || !recommendation}
          className="btn-primary w-full py-3 text-base"
        >
          {submitting ? 'Submitting…' : 'Submit Evaluation'}
        </button>
        {!recommendation && (
          <p className="text-xs text-center text-gray-400 mt-2">Select HIRE or NO HIRE to submit</p>
        )}
      </div>
    </div>
  )
}
