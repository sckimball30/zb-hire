'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import {
  MousePointer2, X, Send, Ban, ChevronDown, CheckSquare, AlertTriangle, Check,
} from 'lucide-react'
import { CandidateCard } from './CandidateCard'
import { RejectionModal } from '@/components/applications/RejectionModal'
import { STAGE_LABELS, STAGE_COLORS, STAGE_COLUMN_COLORS, ALL_STAGES, REJECTION_REASONS } from '@/lib/constants'
import type { CandidateStage, ApplicationWithRelations } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type Template = { id: string; name: string; subject: string; body: string; category: string }

interface KanbanBoardProps {
  groupedApplications: Record<CandidateStage, ApplicationWithRelations[]>
  jobId: string
  jobTitle?: string
  contactedCandidateIds?: string[]
  templates?: Template[]
}

interface PendingRejection {
  applicationId: string
  fromStage: CandidateStage
  candidateId: string
  candidateFirstName: string
  jobTitle: string
  currentStage: CandidateStage
}

const MOVEABLE_STAGES: { value: CandidateStage; label: string }[] = [
  { value: 'APPLIED',      label: 'Applied' },
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'INTERVIEWING', label: 'Interviewing' },
  { value: 'ONSITE',       label: 'Onsite' },
  { value: 'OFFER',        label: 'Offer' },
  { value: 'HIRED',        label: 'Hired' },
]

// ── Variable helpers ──────────────────────────────────────────────────────────

const AUTO_VARS = new Set([
  'First Name', 'firstName', 'Last Name', 'lastName',
  'Full Name', 'fullName', 'Job Title', 'jobTitle',
])

function extractVars(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))]
}

function previewText(
  text: string,
  firstName: string,
  lastName: string,
  jobTitle: string,
  manualVars: Record<string, string>
): string {
  let out = text
  const vars: Record<string, string> = {
    'First Name': firstName, firstName,
    'Last Name': lastName, lastName,
    'Full Name': `${firstName} ${lastName}`, fullName: `${firstName} ${lastName}`,
    'Job Title': jobTitle, jobTitle,
    ...manualVars,
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v) out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

// ── BulkMessageModal ──────────────────────────────────────────────────────────

function BulkMessageModal({
  selectedApps,
  jobTitle,
  templates,
  onClose,
  onSent,
}: {
  selectedApps: { appId: string; firstName: string; lastName: string }[]
  jobTitle: string
  templates: Template[]
  onClose: () => void
  onSent: () => void
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [manualVars, setManualVars] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [sending, setSending] = useState(false)

  const templatesByCategory = useMemo(() => {
    const map: Record<string, Template[]> = {}
    for (const t of templates) {
      if (!map[t.category]) map[t.category] = []
      map[t.category].push(t)
    }
    return map
  }, [templates])

  const manualVarNames = useMemo(() => {
    const all = [...extractVars(subject), ...extractVars(body)]
    return [...new Set(all)].filter(v => !AUTO_VARS.has(v))
  }, [subject, body])

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id)
    if (t) { setSubject(t.subject); setBody(t.body); setManualVars({}) }
    setSelectedTemplateId(id)
    setShowPreview(false)
  }

  const first = selectedApps[0]
  const previewSubject = first
    ? previewText(subject, first.firstName, first.lastName, jobTitle, manualVars)
    : subject
  const previewBody = first
    ? previewText(body, first.firstName, first.lastName, jobTitle, manualVars)
    : body

  const unfilledManual = manualVarNames.filter(v => !manualVars[v]?.trim())
  const canSend = subject.trim() && body.trim() && unfilledManual.length === 0

  async function send() {
    if (!canSend) return
    setSending(true)
    const res = await fetch('/api/messages/bulk-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationIds: selectedApps.map(a => a.appId),
        subject,
        body,
        templateId: selectedTemplateId || undefined,
        manualVars,
      }),
    })
    setSending(false)
    const data = await res.json()
    if (res.ok) {
      if (data.failed > 0) {
        toast.warning(`Sent ${data.sent}, failed ${data.failed}.`)
      } else {
        toast.success(`Sent to ${data.sent} candidate${data.sent !== 1 ? 's' : ''}!`)
      }
      onSent()
    } else {
      toast.error(data.error || 'Failed to send messages.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Send Bulk Message</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Sending individually to {selectedApps.length} candidate{selectedApps.length !== 1 ? 's' : ''} — names and job title personalized automatically
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Recipient chips */}
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {selectedApps.map(a => (
              <span key={a.appId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                {a.firstName} {a.lastName}
              </span>
            ))}
          </div>

          {/* Template picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use a template</label>
            <select value={selectedTemplateId} onChange={e => applyTemplate(e.target.value)} className="input w-full">
              <option value="">— Choose a template —</option>
              {Object.entries(templatesByCategory).map(([cat, tmps]) => (
                <optgroup key={cat} label={cat}>
                  {tmps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Auto-var info */}
          {(subject || body) && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">
                <strong>First Name, Last Name,</strong> and <strong>Job Title</strong> will be automatically personalized for each recipient.
              </p>
            </div>
          )}

          {/* Manual variables */}
          {manualVarNames.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Fill in shared variables</p>
              <p className="text-xs text-amber-600">These will be the same for all recipients.</p>
              {manualVarNames.map(v => (
                <div key={v}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{v}</label>
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder={`Enter ${v.toLowerCase()}…`}
                    value={manualVars[v] ?? ''}
                    onChange={e => setManualVars(prev => ({ ...prev, [v]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="input w-full"
              placeholder="Subject line"
            />
          </div>

          {/* Body + preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Message</label>
              {subject && body && first && (
                <button
                  type="button"
                  onClick={() => setShowPreview(v => !v)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                  {showPreview ? 'Edit' : `Preview (${first.firstName})`}
                </button>
              )}
            </div>
            {showPreview ? (
              <div>
                <p className="text-xs text-gray-400 mb-1">Subject: <span className="text-gray-700">{previewSubject}</span></p>
                <div className="border border-gray-200 rounded-lg p-3 text-sm text-gray-800 bg-gray-50 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {previewBody}
                </div>
              </div>
            ) : (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={9}
                className="input w-full resize-none text-sm"
                placeholder="Write your message…"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-400">
            {unfilledManual.length > 0
              ? `⚠ Fill in: ${unfilledManual.join(', ')}`
              : selectedApps.length > 0
                ? `Ready to send to ${selectedApps.length} candidate${selectedApps.length !== 1 ? 's' : ''}`
                : ''}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline">Cancel</button>
            <button
              onClick={send}
              disabled={sending || !canSend}
              className="btn-primary flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending…' : `Send to ${selectedApps.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BulkRejectModal ──────────────────────────────────────────────────────────

function BulkRejectModal({
  count,
  jobTitle,
  templates,
  onConfirm,
  onCancel,
}: {
  count: number
  jobTitle: string
  templates: Template[]
  onConfirm: (opts: { rejectionReason: string; sendEmail: boolean; templateId: string }) => Promise<void>
  onCancel: () => void
}) {
  const rejectionTemplates = templates.filter(t => t.name.toLowerCase().includes('reject'))

  const [rejectionReason, setRejectionReason] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    () => rejectionTemplates[0]?.id ?? ''
  )
  const [saving, setSaving] = useState(false)

  const canConfirm = !!rejectionReason && (!sendEmail || !!selectedTemplateId || rejectionTemplates.length === 0)

  async function handleConfirm() {
    if (!rejectionReason) { toast.warning('Please select a rejection reason.'); return }
    setSaving(true)
    try {
      await onConfirm({ rejectionReason, sendEmail, templateId: selectedTemplateId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              Reject {count} Candidate{count !== 1 ? 's' : ''}?
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              All selected candidates will be moved to the Rejected stage.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Rejection reason */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REJECTION_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRejectionReason(r.value)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    rejectionReason === r.value
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Send email toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">Send rejection email</p>
              <p className="text-xs text-gray-400 mt-0.5">Notify each candidate individually</p>
            </div>
            <button
              type="button"
              onClick={() => setSendEmail(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${sendEmail ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sendEmail ? 'translate-x-5' : ''}`} />
            </button>
          </label>

          {sendEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection template</label>
              {rejectionTemplates.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  No rejection templates found.{' '}
                  <a href="/messages/templates" className="underline">Create one</a> first.
                </p>
              ) : (
                <select
                  className="input w-full text-sm"
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">— Select a template —</option>
                  {rejectionTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              {selectedTemplateId && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Emails are sent immediately with First Name and Job Title personalized per candidate.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={saving || !canConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Processing…' : (
              <>
                <Ban className="w-3.5 h-3.5" />
                {sendEmail && selectedTemplateId ? 'Reject & Send Email' : 'Confirm Rejection'}
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────

export function KanbanBoard({
  groupedApplications,
  jobId,
  jobTitle = '',
  contactedCandidateIds = [],
  templates = [],
}: KanbanBoardProps) {
  const [groups, setGroups] = useState(groupedApplications)
  const [activeApp, setActiveApp] = useState<ApplicationWithRelations | null>(null)
  const [pendingRejection, setPendingRejection] = useState<PendingRejection | null>(null)
  const contactedSet = new Set(contactedCandidateIds)

  // ── Select mode state ─────────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false)
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const [bulkMoveStage, setBulkMoveStage] = useState<CandidateStage | ''>('')
  const [moving, setMoving] = useState(false)
  const [bulkMsgOpen, setBulkMsgOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Build flat list of selected apps for the message modal
  const selectedApps = useMemo(() => {
    const result: { appId: string; firstName: string; lastName: string }[] = []
    for (const stage of ALL_STAGES) {
      for (const app of groups[stage]) {
        if (selectedAppIds.has(app.id)) {
          result.push({
            appId: app.id,
            firstName: app.candidate.firstName,
            lastName: app.candidate.lastName,
          })
        }
      }
    }
    return result
  }, [selectedAppIds, groups])

  // ── Select mode helpers ───────────────────────────────────────────────────

  function toggleSelectMode() {
    setSelectMode(v => !v)
    setSelectedAppIds(new Set())
    setBulkMoveStage('')
  }

  function toggleApp(appId: string) {
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      if (next.has(appId)) next.delete(appId)
      else next.add(appId)
      return next
    })
  }

  function selectAllInStage(stage: CandidateStage) {
    const stageIds = groups[stage].map(a => a.id)
    const allSelected = stageIds.length > 0 && stageIds.every(id => selectedAppIds.has(id))
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        stageIds.forEach(id => next.delete(id))
      } else {
        stageIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  // ── Bulk move ─────────────────────────────────────────────────────────────

  async function handleBulkMove() {
    if (!bulkMoveStage || selectedAppIds.size === 0) return
    const stage = bulkMoveStage as CandidateStage
    const ids = [...selectedAppIds]

    // Optimistic update
    setGroups(prev => {
      const moved: ApplicationWithRelations[] = []
      const next = { ...prev }
      for (const s of ALL_STAGES) {
        const toMove: ApplicationWithRelations[] = []
        const keep: ApplicationWithRelations[] = []
        for (const app of prev[s]) {
          if (ids.includes(app.id)) toMove.push({ ...app, stage })
          else keep.push(app)
        }
        moved.push(...toMove)
        next[s] = keep
      }
      next[stage] = [...prev[stage].filter(a => !ids.includes(a.id)), ...moved]
      return next
    })

    setSelectedAppIds(new Set())
    setBulkMoveStage('')
    setSelectMode(false)
    setMoving(true)

    try {
      const res = await fetch('/api/applications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds: ids, stage }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Moved ${ids.length} candidate${ids.length !== 1 ? 's' : ''} to ${STAGE_LABELS[stage]}`)
    } catch {
      toast.error('Failed to move candidates. Please refresh.')
    } finally {
      setMoving(false)
    }
  }

  // ── Bulk reject ───────────────────────────────────────────────────────────

  async function handleBulkRejectConfirm({
    rejectionReason,
    sendEmail,
    templateId,
  }: {
    rejectionReason: string
    sendEmail: boolean
    templateId: string
  }) {
    const ids = [...selectedAppIds]

    // Optimistic state update — move to REJECTED column
    setGroups(prev => {
      const moved: ApplicationWithRelations[] = []
      const next = { ...prev }
      for (const s of ALL_STAGES) {
        const toMove: ApplicationWithRelations[] = []
        const keep: ApplicationWithRelations[] = []
        for (const app of prev[s]) {
          if (ids.includes(app.id)) toMove.push({ ...app, stage: 'REJECTED' })
          else keep.push(app)
        }
        moved.push(...toMove)
        next[s] = keep
      }
      next['REJECTED'] = [...prev['REJECTED'].filter(a => !ids.includes(a.id)), ...moved]
      return next
    })

    setBulkRejectOpen(false)
    setSelectedAppIds(new Set())
    setSelectMode(false)

    try {
      await fetch('/api/applications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds: ids, stage: 'REJECTED', rejectionReason }),
      })

      if (sendEmail && templateId) {
        const template = templates.find(t => t.id === templateId)
        if (template) {
          const res = await fetch('/api/messages/bulk-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationIds: ids,
              subject: template.subject,
              body: template.body,
              templateId,
              manualVars: {},
            }),
          })
          const data = await res.json()
          if (data.failed > 0) {
            toast.warning(`Rejected ${ids.length}. Sent ${data.sent} emails, ${data.failed} failed.`)
          } else {
            toast.success(`Rejected ${ids.length} candidate${ids.length !== 1 ? 's' : ''} & sent rejection emails.`)
          }
          return
        }
      }
      toast.success(`Rejected ${ids.length} candidate${ids.length !== 1 ? 's' : ''}.`)
    } catch {
      toast.error('Something went wrong. Please refresh.')
    }
  }

  // ── DnD helpers ───────────────────────────────────────────────────────────

  const findStage = useCallback(
    (id: string): CandidateStage | null => {
      if (ALL_STAGES.includes(id as CandidateStage)) return id as CandidateStage
      for (const stage of ALL_STAGES) {
        if (groups[stage].some((a) => a.id === id)) return stage
      }
      return null
    },
    [groups]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (selectMode) return
      const stage = findStage(event.active.id as string)
      if (stage) {
        const app = groups[stage].find((a) => a.id === event.active.id) || null
        setActiveApp(app)
      }
    },
    [findStage, groups, selectMode]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (selectMode) return
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId   = over.id  as string

      const fromStage = findStage(activeId)
      const toStage   = findStage(overId)

      if (!fromStage || !toStage || fromStage === toStage) return

      setGroups((prev) => {
        const movedApp = prev[fromStage].find((a) => a.id === activeId)
        if (!movedApp) return prev
        return {
          ...prev,
          [fromStage]: prev[fromStage].filter((a) => a.id !== activeId),
          [toStage]:   [...prev[toStage], { ...movedApp, stage: toStage }],
        }
      })
    },
    [findStage, selectMode]
  )

  const commitStageChange = async (applicationId: string, newStage: CandidateStage) => {
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    if (!res.ok) throw new Error('Failed to update stage')
    toast.success(`Moved to ${STAGE_LABELS[newStage]}`)
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (selectMode) return
      const { active, over } = event
      setActiveApp(null)

      if (!over) { setGroups(groupedApplications); return }

      const activeId = active.id as string
      const overId   = over.id  as string

      const originalStage = (() => {
        for (const stage of ALL_STAGES) {
          if (groupedApplications[stage].some((a) => a.id === activeId)) return stage
        }
        return null
      })()

      const toStage = findStage(overId)
      if (!originalStage || !toStage || originalStage === toStage) return

      if (toStage === 'REJECTED') {
        setGroups(groupedApplications)
        const app = groupedApplications[originalStage].find(a => a.id === activeId)
        if (app) {
          setPendingRejection({
            applicationId: activeId,
            fromStage: originalStage,
            candidateId: (app.candidate as any).id,
            candidateFirstName: (app.candidate as any).firstName ?? '',
            jobTitle: jobTitle || (app as any).job?.title || '',
            currentStage: originalStage,
          })
        }
        return
      }

      try {
        await commitStageChange(activeId, toStage)
      } catch {
        setGroups(groupedApplications)
        toast.error('Failed to move candidate — please try again.')
      }
    },
    [findStage, groupedApplications, selectMode]
  )

  const handleRejectionConfirmed = async () => {
    if (!pendingRejection) return
    await commitStageChange(pendingRejection.applicationId, 'REJECTED')
    setGroups(prev => {
      const app = prev[pendingRejection.fromStage]?.find(a => a.id === pendingRejection.applicationId)
        ?? groupedApplications[pendingRejection.fromStage]?.find(a => a.id === pendingRejection.applicationId)
      if (!app) return prev
      return {
        ...prev,
        [pendingRejection.fromStage]: prev[pendingRejection.fromStage].filter(a => a.id !== pendingRejection.applicationId),
        REJECTED: [...prev.REJECTED, { ...app, stage: 'REJECTED' as CandidateStage }],
      }
    })
    setPendingRejection(null)
  }

  const handleRejectionCancelled = () => {
    setGroups(groupedApplications)
    setPendingRejection(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const showActionBar = selectMode && selectedAppIds.size > 0

  return (
    <>
      {/* Select mode toggle */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={toggleSelectMode}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            selectMode
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {selectMode ? (
            <><X className="w-3.5 h-3.5" /> Cancel Selection</>
          ) : (
            <><MousePointer2 className="w-3.5 h-3.5" /> Select Candidates</>
          )}
        </button>

        {selectMode && (
          <span className="text-sm text-gray-500">
            {selectedAppIds.size > 0
              ? `${selectedAppIds.size} selected — tap cards to select`
              : 'Tap cards to select'}
          </span>
        )}
      </div>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex gap-4 h-full ${showActionBar ? 'pb-20' : ''}`}>
          {ALL_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              applications={groups[stage]}
              contactedSet={contactedSet}
              selectMode={selectMode}
              selectedAppIds={selectedAppIds}
              onToggleApp={toggleApp}
              onSelectAll={() => selectAllInStage(stage)}
              allSelected={groups[stage].length > 0 && groups[stage].every(a => selectedAppIds.has(a.id))}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeApp && (
            <div className="opacity-90 rotate-1 scale-105">
              <CandidateCard application={activeApp} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Single-candidate rejection modal (drag-to-reject) */}
      {pendingRejection && (
        <RejectionModal
          candidateFirstName={pendingRejection.candidateFirstName}
          candidateId={pendingRejection.candidateId}
          jobTitle={pendingRejection.jobTitle}
          currentStage={pendingRejection.currentStage}
          onConfirm={handleRejectionConfirmed}
          onCancel={handleRejectionCancelled}
        />
      )}

      {/* Bulk message modal */}
      {bulkMsgOpen && (
        <BulkMessageModal
          selectedApps={selectedApps}
          jobTitle={jobTitle}
          templates={templates}
          onClose={() => setBulkMsgOpen(false)}
          onSent={() => {
            setBulkMsgOpen(false)
            setSelectMode(false)
            setSelectedAppIds(new Set())
          }}
        />
      )}

      {/* Bulk reject modal */}
      {bulkRejectOpen && (
        <BulkRejectModal
          count={selectedAppIds.size}
          jobTitle={jobTitle}
          templates={templates}
          onConfirm={handleBulkRejectConfirm}
          onCancel={() => setBulkRejectOpen(false)}
        />
      )}

      {/* Sticky bulk action bar */}
      {showActionBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-xl">
          <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">

            {/* Count badge */}
            <div className="flex items-center gap-2 mr-1">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {selectedAppIds.size} selected
              </span>
            </div>

            <div className="w-px h-7 bg-gray-200" />

            {/* Move to stage */}
            <div className="flex items-center gap-2">
              <select
                value={bulkMoveStage}
                onChange={e => setBulkMoveStage(e.target.value as CandidateStage | '')}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              >
                <option value="">Move to stage…</option>
                {MOVEABLE_STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkMove}
                disabled={!bulkMoveStage || moving}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {moving ? 'Moving…' : 'Move'}
              </button>
            </div>

            <div className="w-px h-7 bg-gray-200" />

            {/* Send message */}
            <button
              onClick={() => setBulkMsgOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Message
            </button>

            {/* Reject */}
            <button
              onClick={() => setBulkRejectOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Reject
            </button>

            {/* Clear */}
            <button
              onClick={() => setSelectedAppIds(new Set())}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  applications,
  contactedSet,
  selectMode,
  selectedAppIds,
  onToggleApp,
  onSelectAll,
  allSelected,
}: {
  stage: CandidateStage
  applications: ApplicationWithRelations[]
  contactedSet: Set<string>
  selectMode: boolean
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  onSelectAll: () => void
  allSelected: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const ids = applications.map((a) => a.id)

  return (
    <div
      className={`flex flex-col w-56 flex-shrink-0 rounded-xl border-t-4 transition-colors ${STAGE_COLUMN_COLORS[stage]} ${
        isOver ? 'bg-blue-50' : 'bg-gray-50'
      }`}
    >
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{STAGE_LABELS[stage]}</span>
          <div className="flex items-center gap-1.5">
            {selectMode && applications.length > 0 && (
              <button
                onClick={onSelectAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {allSelected ? 'Deselect' : 'All'}
              </button>
            )}
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${STAGE_COLORS[stage]}`}>
              {applications.length}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-24 rounded-b-xl transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <CandidateCard
              key={app.id}
              application={app}
              contacted={contactedSet.has((app as any).candidate?.id ?? '')}
              selectMode={selectMode}
              isSelected={selectedAppIds.has(app.id)}
              onToggleSelect={() => onToggleApp(app.id)}
            />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className={`flex items-center justify-center h-16 text-xs rounded-lg border-2 border-dashed transition-colors ${
            isOver
              ? 'border-blue-400 bg-blue-100 text-blue-500'
              : 'border-gray-200 text-gray-400'
          }`}>
            {isOver ? 'Release to drop' : 'Drop here'}
          </div>
        )}
      </div>
    </div>
  )
}
