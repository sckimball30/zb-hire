'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Check, X, Edit2 } from 'lucide-react'

interface Question {
  id: string
  text: string
  category: string
  isStandard: boolean
  guidance?: string | null
}

interface TemplateQuestion {
  questionId: string
  sortOrder: number
  required: boolean
  question: Question
}

interface TemplateSection {
  title: string
  sortOrder: number
  questions: TemplateQuestion[]
}

interface ScorecardTemplateBuilderProps {
  jobId: string
  initialTemplate: {
    id: string
    name: string
    sections: TemplateSection[]
  } | null
  allQuestions: Question[]
}

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  CULTURE_FIT: 'Culture Fit',
  LEADERSHIP: 'Leadership',
  COMMUNICATION: 'Communication',
  PROBLEM_SOLVING: 'Problem Solving',
  ROLE_SPECIFIC: 'Role Specific',
}

export function ScorecardTemplateBuilder({
  jobId,
  initialTemplate,
  allQuestions,
}: ScorecardTemplateBuilderProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templateName, setTemplateName] = useState(initialTemplate?.name ?? 'Interview Scorecard')
  const [sections, setSections] = useState<{
    title: string
    questions: { questionId: string; required: boolean; question: Question }[]
    expanded: boolean
  }[]>(
    initialTemplate?.sections.map(s => ({
      title: s.title,
      expanded: true,
      questions: s.questions.map(q => ({
        questionId: q.questionId,
        required: q.required,
        question: q.question,
      })),
    })) ?? []
  )

  const [questionPickerSection, setQuestionPickerSection] = useState<number | null>(null)
  const [questionSearch, setQuestionSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const addSection = () => {
    setSections(s => [...s, { title: 'New Section', questions: [], expanded: true }])
  }

  const removeSection = (i: number) => {
    setSections(s => s.filter((_, idx) => idx !== i))
  }

  const updateSectionTitle = (i: number, title: string) => {
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, title } : sec))
  }

  const toggleSection = (i: number) => {
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, expanded: !sec.expanded } : sec))
  }

  const removeQuestion = (sectionIdx: number, questionId: string) => {
    setSections(s => s.map((sec, idx) =>
      idx === sectionIdx
        ? { ...sec, questions: sec.questions.filter(q => q.questionId !== questionId) }
        : sec
    ))
  }

  const toggleRequired = (sectionIdx: number, questionId: string) => {
    setSections(s => s.map((sec, idx) =>
      idx === sectionIdx
        ? {
            ...sec,
            questions: sec.questions.map(q =>
              q.questionId === questionId ? { ...q, required: !q.required } : q
            ),
          }
        : sec
    ))
  }

  const addQuestion = (sectionIdx: number, question: Question) => {
    setSections(s => s.map((sec, idx) => {
      if (idx !== sectionIdx) return sec
      if (sec.questions.some(q => q.questionId === question.id)) {
        toast.error('Question already in this section')
        return sec
      }
      return {
        ...sec,
        questions: [...sec.questions, { questionId: question.id, required: false, question }],
      }
    }))
  }

  const addWigglitzStandardSection = () => {
    const standard = allQuestions.filter(q => q.isStandard)
    if (standard.length === 0) {
      toast.error('No Wigglitz Standard questions found')
      return
    }
    // Group by category
    const groups: Record<string, Question[]> = {}
    standard.forEach(q => {
      if (!groups[q.category]) groups[q.category] = []
      groups[q.category].push(q)
    })
    const newSections = Object.entries(groups).map(([cat, qs]) => ({
      title: `${CATEGORY_LABELS[cat] ?? cat} — Wigglitz Standard`,
      expanded: true,
      questions: qs.map(q => ({ questionId: q.id, required: false, question: q })),
    }))
    setSections(s => [...s, ...newSections])
    toast.success(`Added ${newSections.length} Wigglitz Standard section${newSections.length !== 1 ? 's' : ''}`)
  }

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/scorecard-template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          sections: sections.map((sec, sIdx) => ({
            title: sec.title,
            sortOrder: sIdx,
            questions: sec.questions.map((q, qIdx) => ({
              questionId: q.questionId,
              sortOrder: qIdx,
              required: q.required,
            })),
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save template')
      toast.success('Scorecard template saved!')
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTemplateName(initialTemplate?.name ?? 'Interview Scorecard')
    setSections(
      initialTemplate?.sections.map(s => ({
        title: s.title,
        expanded: true,
        questions: s.questions.map(q => ({
          questionId: q.questionId,
          required: q.required,
          question: q.question,
        })),
      })) ?? []
    )
    setEditing(false)
    setQuestionPickerSection(null)
  }

  const filteredQuestions = allQuestions.filter(q => {
    const matchesSearch = !questionSearch || q.text.toLowerCase().includes(questionSearch.toLowerCase())
    const matchesCat = !categoryFilter || q.category === categoryFilter
    return matchesSearch && matchesCat
  })

  // ── Read-only view ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Scorecard Template</h3>
          <button
            onClick={() => setEditing(true)}
            className="btn-outline text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3 h-3" />
            {initialTemplate ? 'Edit Template' : 'Create Template'}
          </button>
        </div>

        {!initialTemplate ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 italic mb-3">No scorecard template yet.</p>
            <button
              onClick={() => setEditing(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-3 h-3" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">{initialTemplate.name}</p>
            {initialTemplate.sections.map((sec, i) => (
              <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">{sec.title}</p>
                  <p className="text-xs text-gray-400">{sec.questions.length} question{sec.questions.length !== 1 ? 's' : ''}</p>
                </div>
                <ul className="divide-y divide-gray-50">
                  {sec.questions.map((q, qi) => (
                    <li key={qi} className="px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-700 leading-relaxed">{q.question.text}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {q.question.isStandard && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-teal-100 text-teal-700 font-medium">WS</span>
                          )}
                          {q.required && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600">Req</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Edit view ───────────────────────────────────────────────────────────────
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Edit Scorecard Template</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleCancel} disabled={saving} className="btn-outline text-xs flex items-center gap-1.5">
            <X className="w-3 h-3" /> Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5">
            <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Template name */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Template Name</label>
          <input
            className="input text-sm"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="e.g. Full Interview Scorecard"
          />
        </div>

        {/* Quick-add Wigglitz Standard */}
        <button
          type="button"
          onClick={addWigglitzStandardSection}
          className="w-full py-2 px-3 rounded-lg border border-dashed border-teal-300 text-xs text-teal-700 font-medium hover:bg-teal-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          Add All Wigglitz Standard Questions
        </button>

        {/* Sections */}
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Section header */}
            <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <button
                type="button"
                onClick={() => toggleSection(sIdx)}
                className="text-gray-400 flex-shrink-0"
              >
                {sec.expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <input
                className="flex-1 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                value={sec.title}
                onChange={e => updateSectionTitle(sIdx, e.target.value)}
                placeholder="Section title…"
              />
              <button
                type="button"
                onClick={() => removeSection(sIdx)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {sec.expanded && (
              <div className="divide-y divide-gray-50">
                {sec.questions.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-400 italic">No questions yet — add from the bank below.</p>
                )}
                {sec.questions.map((q, qIdx) => (
                  <div key={qIdx} className="px-4 py-2.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-relaxed">{q.question.text}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-gray-400">{CATEGORY_LABELS[q.question.category] ?? q.question.category}</span>
                        {q.question.isStandard && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-teal-100 text-teal-700 font-medium">Wigglitz Standard</span>
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={() => toggleRequired(sIdx, q.questionId)}
                        className="rounded"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => removeQuestion(sIdx, q.questionId)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add question button */}
                <div className="px-4 py-2">
                  {questionPickerSection === sIdx ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="input text-xs flex-1"
                          placeholder="Search questions…"
                          value={questionSearch}
                          onChange={e => setQuestionSearch(e.target.value)}
                          autoFocus
                        />
                        <select
                          className="input text-xs w-36"
                          value={categoryFilter}
                          onChange={e => setCategoryFilter(e.target.value)}
                        >
                          <option value="">All categories</option>
                          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => { setQuestionPickerSection(null); setQuestionSearch(''); setCategoryFilter('') }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="rounded-lg border border-gray-200 max-h-56 overflow-y-auto divide-y divide-gray-50">
                        {filteredQuestions.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-gray-400">No questions match your search.</p>
                        ) : (
                          filteredQuestions.map(q => {
                            const alreadyAdded = sec.questions.some(sq => sq.questionId === q.id)
                            return (
                              <button
                                key={q.id}
                                type="button"
                                disabled={alreadyAdded}
                                onClick={() => addQuestion(sIdx, q)}
                                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-800 leading-relaxed">{q.text}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[q.category] ?? q.category}</span>
                                      {q.isStandard && (
                                        <span className="px-1.5 py-0.5 rounded text-xs bg-teal-100 text-teal-700 font-medium">WS</span>
                                      )}
                                    </div>
                                  </div>
                                  {alreadyAdded && <span className="text-xs text-gray-400 flex-shrink-0">Added</span>}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setQuestionPickerSection(sIdx); setQuestionSearch(''); setCategoryFilter('') }}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add question from bank
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add section */}
        <button
          type="button"
          onClick={addSection}
          className="w-full py-2 px-3 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          Add Section
        </button>
      </div>
    </div>
  )
}
