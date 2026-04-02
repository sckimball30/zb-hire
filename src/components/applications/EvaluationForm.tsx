'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface ScorecardEntry {
  id: string
  applicationId: string
  sectionTitle: string
  interviewerName: string
  interviewerId?: string | null
  responses: string
  status: string
  submittedAt?: string | null
  createdAt: string
  updatedAt: string
}

interface EvaluationFormProps {
  applicationId: string
  interviewers: Interviewer[]
  template: { sections: TemplateSection[] } | null
  initialEntries: ScorecardEntry[]
  availableStart: string | null
  salaryExpectation: string | null
}

type ABC = 'A' | 'B' | 'C' | null

// ─── Helper components ────────────────────────────────────────────────────────

function ABCButtons({
  value,
  onChange,
  size = 'sm',
}: {
  value: ABC
  onChange: (v: ABC) => void
  size?: 'sm' | 'lg'
}) {
  const opts: { val: ABC; cls: string }[] = [
    { val: 'A', cls: 'bg-green-600 border-green-600 text-white' },
    { val: 'B', cls: 'bg-amber-400 border-amber-400 text-white' },
    { val: 'C', cls: 'bg-red-600 border-red-600 text-white' },
  ]
  const base =
    size === 'lg'
      ? 'px-5 py-2 text-base min-w-[52px]'
      : 'px-3 py-1.5 text-sm min-w-[36px]'
  return (
    <div className="flex items-center gap-1.5">
      {opts.map((o) => (
        <button
          key={o.val as string}
          type="button"
          onClick={() => onChange(value === o.val ? null : o.val)}
          className={`${base} font-bold border rounded-md transition-all ${
            value === o.val
              ? o.cls
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {o.val}
        </button>
      ))}
    </div>
  )
}

function YesNoButtons({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {['Yes', 'No'].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? null : opt)}
          className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-all ${
            value === opt
              ? opt === 'Yes'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function ratingBadgeClass(rating: string | null) {
  if (rating === 'A') return 'bg-green-100 text-green-700'
  if (rating === 'B') return 'bg-amber-100 text-amber-700'
  if (rating === 'C') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

function computeSectionRating(responsesJson: string): string | null {
  try {
    const parsed = JSON.parse(responsesJson) as Record<
      string,
      { rating?: string | null }
    >
    const ratings = Object.values(parsed)
      .map((r) => r?.rating)
      .filter(Boolean) as string[]
    if (!ratings.length) return null
    const counts: Record<string, number> = {}
    for (const r of ratings) counts[r] = (counts[r] || 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  } catch {
    return null
  }
}

function formatDateShort(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── SubmittedEntryRow ────────────────────────────────────────────────────────

function SubmittedEntryRow({
  entry,
  questions,
}: {
  entry: ScorecardEntry
  questions: TemplateQuestion[]
}) {
  const [expanded, setExpanded] = useState(false)
  const rating = computeSectionRating(entry.responses)
  let parsed: Record<string, { rating?: string | null; notes?: string | null }> = {}
  try {
    parsed = JSON.parse(entry.responses)
  } catch {}

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 mb-2">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800">
            {entry.interviewerName}
          </span>
          {rating && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${ratingBadgeClass(rating)}`}
            >
              {rating} Player
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {formatDateShort(entry.submittedAt)}
          </span>
          <span className="text-gray-400 text-xs">{expanded ? '▴' : '▾'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {questions.map((tq) => {
            const r = parsed[tq.questionId]
            return (
              <div key={tq.id} className="text-sm">
                <p className="font-medium text-gray-700 mb-0.5">{tq.question.text}</p>
                <div className="flex items-center gap-2">
                  {r?.rating && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${ratingBadgeClass(r.rating)}`}
                    >
                      {r.rating}
                    </span>
                  )}
                  {r?.notes && (
                    <span className="text-gray-600 italic text-xs">"{r.notes}"</span>
                  )}
                  {!r?.rating && !r?.notes && (
                    <span className="text-gray-400 text-xs">No response</span>
                  )}
                </div>
              </div>
            )
          })}
          {/* Handle special Final Assessment responses */}
          {questions.length === 0 && (
            <div className="space-y-2">
              {Object.entries(parsed).map(([key, val]) => (
                <div key={key} className="text-sm flex items-center gap-2">
                  <span className="text-gray-600 font-medium">{key}:</span>
                  {val?.rating && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${ratingBadgeClass(val.rating)}`}
                    >
                      {val.rating}
                    </span>
                  )}
                  {(val as any)?.value && (
                    <span className="text-gray-600 text-xs">{(val as any).value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  applicationId: string
  sectionTitle: string
  questions: TemplateQuestion[]
  interviewers: Interviewer[]
  submittedEntries: ScorecardEntry[]
  draftEntry: ScorecardEntry | null
  onEntrySaved: (entry: ScorecardEntry) => void
  // Screening extras
  isScreening?: boolean
  availableStart: string | null
  salaryExpectation: string | null
  onScreeningFieldsChange?: (fields: { availableStart: string; salaryExpectation: string }) => void
}

function SectionCard({
  applicationId,
  sectionTitle,
  questions,
  interviewers,
  submittedEntries,
  draftEntry,
  onEntrySaved,
  isScreening = false,
  availableStart,
  salaryExpectation,
  onScreeningFieldsChange,
}: SectionCardProps) {
  // Interviewer selection
  const [interviewerMode, setInterviewerMode] = useState<'select' | 'text'>(
    draftEntry ? 'text' : interviewers.length > 0 ? 'select' : 'text'
  )
  const [selectedInterviewerId, setSelectedInterviewerId] = useState(
    draftEntry?.interviewerId ?? (interviewers[0]?.id || '')
  )
  const [customName, setCustomName] = useState(
    draftEntry && !draftEntry.interviewerId ? draftEntry.interviewerName : ''
  )

  // Responses: { [questionId]: { rating, notes } }
  const initResponses = useCallback(() => {
    if (!draftEntry) return {} as Record<string, { rating: ABC; notes: string }>
    try {
      const parsed = JSON.parse(draftEntry.responses) as Record<
        string,
        { rating?: string | null; notes?: string | null }
      >
      const out: Record<string, { rating: ABC; notes: string }> = {}
      for (const [k, v] of Object.entries(parsed)) {
        out[k] = { rating: (v?.rating as ABC) ?? null, notes: v?.notes ?? '' }
      }
      return out
    } catch {
      return {}
    }
  }, [draftEntry])

  const [responses, setResponses] = useState<
    Record<string, { rating: ABC; notes: string }>
  >(initResponses)

  // Guide toggle per question
  const [guideOpen, setGuideOpen] = useState<Record<string, boolean>>({})

  // Screening fields
  const [localAvailableStart, setLocalAvailableStart] = useState(availableStart ?? '')
  const [localSalaryExpectation, setLocalSalaryExpectation] = useState(salaryExpectation ?? '')

  const [saving, setSaving] = useState(false)

  const getInterviewerName = () => {
    if (interviewerMode === 'text') return customName.trim()
    const found = interviewers.find((i) => i.id === selectedInterviewerId)
    return found?.name ?? ''
  }

  const getInterviewerId = () => {
    if (interviewerMode === 'select') return selectedInterviewerId || null
    return null
  }

  const setResponse = (
    questionId: string,
    field: 'rating' | 'notes',
    value: ABC | string
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }))
  }

  const buildResponsesPayload = () => {
    const out: Record<string, { rating: ABC; notes: string }> = {}
    for (const tq of questions) {
      out[tq.questionId] = responses[tq.questionId] ?? { rating: null, notes: '' }
    }
    return out
  }

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    const name = getInterviewerName()
    if (!name) {
      toast.error('Please enter your name before saving')
      return
    }

    setSaving(true)
    try {
      const responsesPayload = buildResponsesPayload()

      // Save screening fields if applicable
      if (isScreening) {
        await fetch(`/api/applications/${applicationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            availableStart: localAvailableStart,
            salaryExpectation: localSalaryExpectation,
          }),
        })
        onScreeningFieldsChange?.({
          availableStart: localAvailableStart,
          salaryExpectation: localSalaryExpectation,
        })
      }

      let savedEntry: ScorecardEntry
      if (draftEntry) {
        // PATCH existing draft
        const res = await fetch(
          `/api/applications/${applicationId}/scorecard-entries/${draftEntry.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              responses: responsesPayload,
              status,
              interviewerName: name,
            }),
          }
        )
        if (!res.ok) throw new Error('Failed to update entry')
        savedEntry = await res.json()
      } else {
        // POST new entry
        const res = await fetch(
          `/api/applications/${applicationId}/scorecard-entries`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionTitle,
              interviewerName: name,
              interviewerId: getInterviewerId(),
              responses: responsesPayload,
              status,
            }),
          }
        )
        if (!res.ok) throw new Error('Failed to save entry')
        savedEntry = await res.json()
      }

      onEntrySaved(savedEntry)
      toast.success(
        status === 'SUBMITTED'
          ? `Section "${sectionTitle}" submitted!`
          : `Draft saved for "${sectionTitle}"`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const hasDraft = !!draftEntry

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{sectionTitle}</h2>
      </div>

      {/* Submitted feedback */}
      {submittedEntries.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Submitted feedback
          </p>
          {submittedEntries.map((e) => (
            <SubmittedEntryRow key={e.id} entry={e} questions={questions} />
          ))}
        </div>
      )}

      {/* Add your feedback */}
      <div className="px-5 py-4 border-t border-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          {hasDraft ? 'Your draft' : 'Add your feedback'}
        </p>

        {/* Interviewer name */}
        <div className="mb-4">
          <label className="label block mb-1.5">Your name</label>
          <div className="flex items-center gap-2">
            {interviewers.length > 0 && (
              <select
                className="input flex-1"
                value={interviewerMode === 'select' ? selectedInterviewerId : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setInterviewerMode('text')
                  } else {
                    setInterviewerMode('select')
                    setSelectedInterviewerId(e.target.value)
                  }
                }}
              >
                <option value="">Select…</option>
                {interviewers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                    {i.title ? ` — ${i.title}` : ''}
                  </option>
                ))}
                <option value="__custom__">Other (type name…)</option>
              </select>
            )}
            {(interviewerMode === 'text' || interviewers.length === 0) && (
              <input
                type="text"
                className="input flex-1"
                placeholder="Your name…"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Screening extra fields */}
        {isScreening && (
          <div className="space-y-3 mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div>
              <label className="label block mb-1">
                Timeline — When could they start?
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 2 weeks, immediately, 30 days…"
                value={localAvailableStart}
                onChange={(e) => {
                  setLocalAvailableStart(e.target.value)
                  onScreeningFieldsChange?.({
                    availableStart: e.target.value,
                    salaryExpectation: localSalaryExpectation,
                  })
                }}
              />
            </div>
            <div>
              <label className="label block mb-1">Salary Expectations</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. $85,000/yr, $45/hr…"
                value={localSalaryExpectation}
                onChange={(e) => {
                  setLocalSalaryExpectation(e.target.value)
                  onScreeningFieldsChange?.({
                    availableStart: localAvailableStart,
                    salaryExpectation: e.target.value,
                  })
                }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5 mb-4">
          {questions.map((tq) => {
            const response = responses[tq.questionId] ?? { rating: null, notes: '' }
            const q = tq.question
            const hasGuide = !!(q.aPlayerAnswer || q.bPlayerAnswer || q.cPlayerAnswer)
            const isGuideOpen = guideOpen[tq.questionId] ?? false

            return (
              <div key={tq.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {q.text}
                  {tq.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {q.guidance && (
                  <p className="text-xs text-gray-400 italic mb-2">{q.guidance}</p>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <ABCButtons
                    value={response.rating}
                    onChange={(v) => setResponse(tq.questionId, 'rating', v)}
                  />
                  {hasGuide && (
                    <button
                      type="button"
                      className="text-xs text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setGuideOpen((prev) => ({
                          ...prev,
                          [tq.questionId]: !prev[tq.questionId],
                        }))
                      }
                    >
                      {isGuideOpen ? 'Hide guide ▴' : 'Show guide ▾'}
                    </button>
                  )}
                </div>

                {hasGuide && isGuideOpen && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {q.aPlayerAnswer && (
                      <div className="rounded border border-green-200 bg-green-50 p-2">
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          A Player
                        </p>
                        <p className="text-xs text-green-900 leading-relaxed">
                          {q.aPlayerAnswer}
                        </p>
                      </div>
                    )}
                    {q.bPlayerAnswer && (
                      <div className="rounded border border-amber-200 bg-amber-50 p-2">
                        <p className="text-xs font-semibold text-amber-700 mb-1">
                          B Player
                        </p>
                        <p className="text-xs text-amber-900 leading-relaxed">
                          {q.bPlayerAnswer}
                        </p>
                      </div>
                    )}
                    {q.cPlayerAnswer && (
                      <div className="rounded border border-red-200 bg-red-50 p-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          C Player
                        </p>
                        <p className="text-xs text-red-900 leading-relaxed">
                          {q.cPlayerAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  className="input h-auto text-sm"
                  rows={2}
                  placeholder="Notes on this question…"
                  value={response.notes ?? ''}
                  onChange={(e) => setResponse(tq.questionId, 'notes', e.target.value)}
                />
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            className="btn-outline text-sm"
            disabled={saving}
            onClick={() => handleSave('DRAFT')}
          >
            {saving ? 'Saving…' : hasDraft ? 'Update Draft' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saving}
            onClick={() => handleSave('SUBMITTED')}
          >
            {saving ? 'Submitting…' : 'Submit Section'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FinalAssessmentCard ──────────────────────────────────────────────────────

interface FinalAssessmentCardProps {
  applicationId: string
  interviewers: Interviewer[]
  submittedEntries: ScorecardEntry[]
  draftEntry: ScorecardEntry | null
  onEntrySaved: (entry: ScorecardEntry) => void
}

function FinalAssessmentCard({
  applicationId,
  interviewers,
  submittedEntries,
  draftEntry,
  onEntrySaved,
}: FinalAssessmentCardProps) {
  const sectionTitle = 'Final Assessment'

  // Interviewer selection
  const [interviewerMode, setInterviewerMode] = useState<'select' | 'text'>(
    interviewers.length > 0 ? 'select' : 'text'
  )
  const [selectedInterviewerId, setSelectedInterviewerId] = useState(
    draftEntry?.interviewerId ?? (interviewers[0]?.id || '')
  )
  const [customName, setCustomName] = useState('')

  // Parse draft responses
  const initFromDraft = () => {
    if (!draftEntry) return {}
    try {
      return JSON.parse(draftEntry.responses) as Record<string, { rating?: string | null; value?: string | null }>
    } catch {
      return {}
    }
  }
  const draftParsed = initFromDraft()

  // Core Values
  const [fierceOwnership, setFierceOwnership] = useState<ABC>(
    (draftParsed['fierceOwnership']?.rating as ABC) ?? null
  )
  const [decisiveAction, setDecisiveAction] = useState<ABC>(
    (draftParsed['decisiveAction']?.rating as ABC) ?? null
  )
  const [mentalToughness, setMentalToughness] = useState<ABC>(
    (draftParsed['mentalToughness']?.rating as ABC) ?? null
  )
  const [competitiveExcellence, setCompetitiveExcellence] = useState<ABC>(
    (draftParsed['competitiveExcellence']?.rating as ABC) ?? null
  )

  // Gut Check
  const [gutCheckThrilled, setGutCheckThrilled] = useState<string | null>(
    draftParsed['gutCheckThrilled']?.value ?? null
  )
  const [gutCheckTeam, setGutCheckTeam] = useState<string | null>(
    draftParsed['gutCheckTeam']?.value ?? null
  )
  const [gutCheckEmbarrassed, setGutCheckEmbarrassed] = useState<string | null>(
    draftParsed['gutCheckEmbarrassed']?.value ?? null
  )

  // Recommendation
  const [recommendation, setRecommendation] = useState<'HIRE' | 'NO HIRE' | null>(
    (draftParsed['recommendation']?.value as 'HIRE' | 'NO HIRE' | null) ?? null
  )

  const [saving, setSaving] = useState(false)

  const getInterviewerName = () => {
    if (interviewerMode === 'text') return customName.trim()
    const found = interviewers.find((i) => i.id === selectedInterviewerId)
    return found?.name ?? ''
  }

  const getInterviewerId = () => {
    if (interviewerMode === 'select') return selectedInterviewerId || null
    return null
  }

  const buildPayload = () => ({
    fierceOwnership: { rating: fierceOwnership },
    decisiveAction: { rating: decisiveAction },
    mentalToughness: { rating: mentalToughness },
    competitiveExcellence: { rating: competitiveExcellence },
    gutCheckThrilled: { value: gutCheckThrilled },
    gutCheckTeam: { value: gutCheckTeam },
    gutCheckEmbarrassed: { value: gutCheckEmbarrassed },
    recommendation: { value: recommendation },
  })

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    const name = getInterviewerName()
    if (!name) {
      toast.error('Please enter your name before saving')
      return
    }

    setSaving(true)
    try {
      let savedEntry: ScorecardEntry
      if (draftEntry) {
        const res = await fetch(
          `/api/applications/${applicationId}/scorecard-entries/${draftEntry.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              responses: buildPayload(),
              status,
              interviewerName: name,
            }),
          }
        )
        if (!res.ok) throw new Error('Failed to update entry')
        savedEntry = await res.json()
      } else {
        const res = await fetch(
          `/api/applications/${applicationId}/scorecard-entries`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionTitle,
              interviewerName: name,
              interviewerId: getInterviewerId(),
              responses: buildPayload(),
              status,
            }),
          }
        )
        if (!res.ok) throw new Error('Failed to save entry')
        savedEntry = await res.json()
      }

      onEntrySaved(savedEntry)
      toast.success(
        status === 'SUBMITTED' ? 'Final assessment submitted!' : 'Draft saved'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const hasDraft = !!draftEntry

  return (
    <div className="card overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Final Assessment</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Core values, gut check, and hire recommendation
        </p>
      </div>

      {/* Submitted entries */}
      {submittedEntries.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Submitted feedback
          </p>
          {submittedEntries.map((e) => (
            <SubmittedEntryRow key={e.id} entry={e} questions={[]} />
          ))}
        </div>
      )}

      <div className="px-5 py-4 border-t border-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          {hasDraft ? 'Your draft' : 'Add your assessment'}
        </p>

        {/* Interviewer */}
        <div className="mb-5">
          <label className="label block mb-1.5">Your name</label>
          <div className="flex items-center gap-2">
            {interviewers.length > 0 && (
              <select
                className="input flex-1"
                value={interviewerMode === 'select' ? selectedInterviewerId : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setInterviewerMode('text')
                  } else {
                    setInterviewerMode('select')
                    setSelectedInterviewerId(e.target.value)
                  }
                }}
              >
                <option value="">Select…</option>
                {interviewers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                    {i.title ? ` — ${i.title}` : ''}
                  </option>
                ))}
                <option value="__custom__">Other (type name…)</option>
              </select>
            )}
            {(interviewerMode === 'text' || interviewers.length === 0) && (
              <input
                type="text"
                className="input flex-1"
                placeholder="Your name…"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Core Values</h3>
          <p className="text-xs text-gray-400 mb-3">
            Rate this candidate on four core values.
          </p>
          <div className="space-y-2">
            {[
              { label: 'Fierce Ownership', value: fierceOwnership, set: setFierceOwnership },
              { label: 'Decisive Action', value: decisiveAction, set: setDecisiveAction },
              { label: 'Mental Toughness', value: mentalToughness, set: setMentalToughness },
              {
                label: 'Competitive Excellence',
                value: competitiveExcellence,
                set: setCompetitiveExcellence,
              },
            ].map(({ label, value, set }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-700">{label}</span>
                <ABCButtons value={value} onChange={set} />
              </div>
            ))}
          </div>
        </div>

        {/* Gut Check */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Gut Check</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Would you be thrilled to work with this person every day?',
                value: gutCheckThrilled,
                set: setGutCheckThrilled,
              },
              {
                label: 'Would this person make the team better?',
                value: gutCheckTeam,
                set: setGutCheckTeam,
              },
              {
                label: 'Would you be embarrassed if they joined and underperformed?',
                value: gutCheckEmbarrassed,
                set: setGutCheckEmbarrassed,
              },
            ].map(({ label, value, set }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-700 pr-4">{label}</span>
                <YesNoButtons value={value} onChange={set} />
              </div>
            ))}
          </div>
        </div>

        {/* Final Recommendation */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Final Recommendation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setRecommendation(recommendation === 'HIRE' ? null : 'HIRE')
              }
              className={`py-4 text-base font-bold rounded-xl border-2 transition-all ${
                recommendation === 'HIRE'
                  ? 'bg-green-700 text-white border-green-700 shadow-md'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
              }`}
            >
              HIRE
            </button>
            <button
              type="button"
              onClick={() =>
                setRecommendation(recommendation === 'NO HIRE' ? null : 'NO HIRE')
              }
              className={`py-4 text-base font-bold rounded-xl border-2 transition-all ${
                recommendation === 'NO HIRE'
                  ? 'bg-red-700 text-white border-red-700 shadow-md'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
              }`}
            >
              NO HIRE
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline text-sm"
            disabled={saving}
            onClick={() => handleSave('DRAFT')}
          >
            {saving ? 'Saving…' : hasDraft ? 'Update Draft' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saving || !recommendation}
            onClick={() => handleSave('SUBMITTED')}
          >
            {saving ? 'Submitting…' : 'Submit Assessment'}
          </button>
          {!recommendation && (
            <span className="text-xs text-gray-400 ml-1">
              Select HIRE or NO HIRE to submit
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main EvaluationForm ──────────────────────────────────────────────────────

export function EvaluationForm({
  applicationId,
  interviewers,
  template,
  initialEntries,
  availableStart,
  salaryExpectation,
}: EvaluationFormProps) {
  const [entries, setEntries] = useState<ScorecardEntry[]>(initialEntries)

  const handleEntrySaved = (saved: ScorecardEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  const getEntriesForSection = (title: string) =>
    entries.filter((e) => e.sectionTitle === title)

  const getSubmittedForSection = (title: string) =>
    getEntriesForSection(title).filter((e) => e.status === 'SUBMITTED')

  // Draft: the most recent DRAFT entry for this section (simplified: one draft per section)
  const getDraftForSection = (title: string) =>
    getEntriesForSection(title).find((e) => e.status === 'DRAFT') ?? null

  const sections = template?.sections ?? []

  return (
    <div className="space-y-6">
      {/* Template sections */}
      {sections.length > 0 ? (
        sections.map((section) => {
          const isScreening = section.title.toLowerCase().includes('screen')
          return (
            <SectionCard
              key={section.id}
              applicationId={applicationId}
              sectionTitle={section.title}
              questions={section.questions}
              interviewers={interviewers}
              submittedEntries={getSubmittedForSection(section.title)}
              draftEntry={getDraftForSection(section.title)}
              onEntrySaved={handleEntrySaved}
              isScreening={isScreening}
              availableStart={availableStart}
              salaryExpectation={salaryExpectation}
            />
          )
        })
      ) : (
        <div className="card p-5 border border-dashed border-gray-200">
          <p className="text-sm text-gray-400 italic text-center">
            No scorecard template set up for this job — only the final assessment
            below will be recorded.
          </p>
        </div>
      )}

      {/* Final Assessment (Core Values + Gut Check + Recommendation) */}
      <FinalAssessmentCard
        applicationId={applicationId}
        interviewers={interviewers}
        submittedEntries={getSubmittedForSection('Final Assessment')}
        draftEntry={getDraftForSection('Final Assessment')}
        onEntrySaved={handleEntrySaved}
      />
    </div>
  )
}
