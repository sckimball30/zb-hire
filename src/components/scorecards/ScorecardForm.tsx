'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RatingSelect } from './RatingSelect'
import type { Interviewer, ScorecardTemplateWithRelations } from '@/types'

interface ScorecardFormProps {
  applicationId: string
  template: ScorecardTemplateWithRelations
  interviewers: Interviewer[]
}

interface ResponseState {
  rating: string | null
  notes: string
}

export function ScorecardForm({ applicationId, template, interviewers }: ScorecardFormProps) {
  const router = useRouter()
  const [interviewerId, setInterviewerId] = useState(interviewers[0]?.id || '')
  const [overallRating, setOverallRating] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [responses, setResponses] = useState<Record<string, ResponseState>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const setResponse = (questionId: string, field: keyof ResponseState, value: string | null) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  const buildResponseArray = () =>
    Object.entries(responses).map(([questionId, r]) => ({
      questionId,
      rating: r.rating || null,
      notes: r.notes || null,
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      // First create scorecard
      const createRes = await fetch(`/api/applications/${applicationId}/scorecards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerId }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error || 'Failed to create scorecard')
      }

      const scorecard = await createRes.json()

      // Then save responses
      const patchRes = await fetch(`/api/applications/${applicationId}/scorecards/${scorecard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          summary,
          recommendation,
          responses: buildResponseArray(),
        }),
      })

      if (!patchRes.ok) throw new Error('Failed to save scorecard')

      toast.success('Scorecard saved as draft')
      router.push(`/applications/${applicationId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save scorecard')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!interviewerId) {
      toast.error('Please select an interviewer')
      return
    }
    if (!overallRating) {
      toast.error('Overall rating is required to submit')
      return
    }

    setSubmitting(true)
    try {
      // Create scorecard
      const createRes = await fetch(`/api/applications/${applicationId}/scorecards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerId }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error || 'Failed to create scorecard')
      }

      const scorecard = await createRes.json()

      // Submit with all data
      const patchRes = await fetch(`/api/applications/${applicationId}/scorecards/${scorecard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          summary,
          recommendation,
          responses: buildResponseArray(),
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!patchRes.ok) throw new Error('Failed to submit scorecard')

      toast.success('Scorecard submitted!')
      router.push(`/applications/${applicationId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit scorecard')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Interviewer selection */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Your Information</h2>
        <div>
          <label className="label">Interviewer</label>
          <select
            className="input"
            value={interviewerId}
            onChange={(e) => setInterviewerId(e.target.value)}
          >
            <option value="">Select interviewer...</option>
            {interviewers.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} {i.title ? `(${i.title})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sections */}
      {template.sections.map((section) => (
        <div key={section.id} className="card overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {section.questions.map((tq) => {
              const response = responses[tq.questionId] || { rating: null, notes: '' }
              const q = tq.question as any
              return (
                <div key={tq.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tq.question.text}
                        {tq.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {tq.question.guidance && (
                        <p className="text-xs text-gray-500 mt-1 italic">{tq.question.guidance}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Rating (A / B / C)</label>
                      <RatingSelect
                        value={response.rating}
                        onChange={(rating) => setResponse(tq.questionId, 'rating', rating)}
                        mode="abc"
                      />
                    </div>

                    {/* A/B/C guide inline */}
                    {(q.aPlayerAnswer || q.bPlayerAnswer || q.cPlayerAnswer) && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
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

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Notes</label>
                      <textarea
                        className="input h-auto text-sm"
                        rows={2}
                        placeholder="Add notes about this response..."
                        value={response.notes}
                        onChange={(e) => setResponse(tq.questionId, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Overall */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Overall Assessment</h2>

        <div className="space-y-4">
          <div>
            <label className="label">Overall Rating <span className="text-red-500">*</span></label>
            <RatingSelect
              value={overallRating}
              onChange={setOverallRating}
              size="lg"
              mode="abc"
            />
          </div>

          <div>
            <label className="label">Summary</label>
            <textarea
              className="input h-auto"
              rows={3}
              placeholder="Summarize your overall impression of this candidate..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Recommendation</label>
            <select
              className="input"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            >
              <option value="">Select recommendation...</option>
              <option value="Strong hire">Strong hire</option>
              <option value="Hire">Hire</option>
              <option value="No hire">No hire</option>
              <option value="Strong no hire">Strong no hire</option>
              <option value="Move forward">Move forward</option>
              <option value="Hold">Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting || saving}
          className="btn-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Scorecard'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || submitting}
          className="btn-secondary"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
    </div>
  )
}
