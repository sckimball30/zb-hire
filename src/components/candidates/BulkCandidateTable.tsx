'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Ban, Send, X, Users, ChevronDown, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, isNewApplicant } from '@/lib/utils'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppSummary = {
  id: string; jobId: string; stage: string; createdAt: string
  job: { id: string; title: string }
}
type CandidateSummary = {
  id: string; firstName: string; lastName: string; email: string
  phone: string | null; source: string | null; blocked: boolean; createdAt: string
  applications: AppSummary[]
  tags: { tagId: string; tag: { name: string; color: string } }[]
}
type Template = { id: string; name: string; subject: string; body: string; category: string }
type Job = { id: string; title: string }

const JOB_COLORS = [
  { dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  { dot: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  { dot: 'bg-[#4AFFD2]',  pill: 'bg-[#4AFFD2]/20 text-[#0e7a5c] border-[#4AFFD2]/40' },
  { dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  { dot: 'bg-pink-500',   pill: 'bg-pink-50 text-pink-700 border-pink-200' },
  { dot: 'bg-yellow-500', pill: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { dot: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { dot: 'bg-red-500',    pill: 'bg-red-50 text-red-700 border-red-200' },
]

const MOVEABLE_STAGES = [
  { value: 'APPLIED',      label: 'Applied' },
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'INTERVIEWING', label: 'Interviewing' },
  { value: 'ONSITE',       label: 'Onsite' },
  { value: 'OFFER',        label: 'Offer' },
  { value: 'HIRED',        label: 'Hired' },
  { value: 'REJECTED',     label: 'Rejected' },
]

// ─── Variable helpers ─────────────────────────────────────────────────────────

const AUTO_VARS = new Set([
  'First Name', 'firstName', 'Last Name', 'lastName',
  'Full Name', 'fullName', 'Job Title', 'jobTitle',
])

function extractVars(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))]
}

function hasUnfilled(text: string) { return /\{\{[^}]+\}\}/.test(text) }

function previewForCandidate(text: string, c: CandidateSummary, jobTitle: string, manualVars: Record<string, string>) {
  let out = text
  const vars: Record<string, string> = {
    'First Name': c.firstName, firstName: c.firstName,
    'Last Name': c.lastName, lastName: c.lastName,
    'Full Name': `${c.firstName} ${c.lastName}`, fullName: `${c.firstName} ${c.lastName}`,
    'Job Title': jobTitle, jobTitle,
    ...manualVars,
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v) out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

// ─── Bulk Message Modal ────────────────────────────────────────────────────────

function BulkMessageModal({
  selectedApps,
  candidates,
  templates,
  onClose,
  onSent,
}: {
  selectedApps: { appId: string; candidate: CandidateSummary; jobTitle: string }[]
  templates: Template[]
  candidates: CandidateSummary[]
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

  const previewCandidate = selectedApps[0]
  const previewSubject = previewCandidate
    ? previewForCandidate(subject, previewCandidate.candidate, previewCandidate.jobTitle, manualVars)
    : subject
  const previewBody = previewCandidate
    ? previewForCandidate(body, previewCandidate.candidate, previewCandidate.jobTitle, manualVars)
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
        toast.warning(`Sent ${data.sent}, failed ${data.failed}. Check console for details.`)
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
              Sending individually to {selectedApps.length} candidate{selectedApps.length !== 1 ? 's' : ''} —
              names and job titles will be personalized automatically
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Recipient chips */}
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {selectedApps.map(a => (
              <span key={a.appId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                {a.candidate.firstName} {a.candidate.lastName}
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

          {/* Auto-var info pill */}
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
              {subject && body && previewCandidate && (
                <button
                  type="button"
                  onClick={() => setShowPreview(v => !v)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                  {showPreview ? 'Edit' : `Preview (${previewCandidate.candidate.firstName})`}
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
              : selectedApps.length > 0 ? `Ready to send to ${selectedApps.length} candidate${selectedApps.length !== 1 ? 's' : ''}` : ''}
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

// ─── Main component ───────────────────────────────────────────────────────────

export function BulkCandidateTable({
  candidates,
  jobs,
  templates,
  currentJobId,
}: {
  candidates: CandidateSummary[]
  jobs: Job[]
  templates: Template[]
  currentJobId: string
}) {
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const [pendingStage, setPendingStage] = useState('')
  const [moving, setMoving] = useState(false)
  const [msgModalOpen, setMsgModalOpen] = useState(false)

  // Reset selection when candidate list changes (e.g., filter change)
  useEffect(() => { setSelectedAppIds(new Set()) }, [candidates])

  const jobColorMap = useMemo(
    () => new Map(jobs.map((j, i) => [j.id, JOB_COLORS[i % JOB_COLORS.length]])),
    [jobs]
  )

  /** Returns the application to target for a candidate given the current job filter */
  function getTargetApp(c: CandidateSummary): AppSummary | null {
    if (currentJobId) return c.applications.find(a => a.jobId === currentJobId) ?? null
    return c.applications[0] ?? null
  }

  function toggleCandidate(c: CandidateSummary) {
    const app = getTargetApp(c)
    if (!app) return
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      if (next.has(app.id)) next.delete(app.id)
      else next.add(app.id)
      return next
    })
  }

  function toggleAll() {
    const selectableAppIds = candidates
      .map(c => getTargetApp(c)?.id)
      .filter(Boolean) as string[]
    const allSelected = selectableAppIds.every(id => selectedAppIds.has(id))
    if (allSelected) setSelectedAppIds(new Set())
    else setSelectedAppIds(new Set(selectableAppIds))
  }

  const allSelectableIds = useMemo(
    () => candidates.map(c => getTargetApp(c)?.id).filter(Boolean) as string[],
    [candidates, currentJobId]
  )
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedAppIds.has(id))
  const someSelected = selectedAppIds.size > 0

  /** Build the list of selected app+candidate pairs for the message modal */
  const selectedApps = useMemo(() => {
    const result: { appId: string; candidate: CandidateSummary; jobTitle: string }[] = []
    for (const c of candidates) {
      const app = getTargetApp(c)
      if (app && selectedAppIds.has(app.id)) {
        result.push({ appId: app.id, candidate: c, jobTitle: app.job.title })
      }
    }
    return result
  }, [candidates, selectedAppIds, currentJobId])

  async function moveToStage() {
    if (!pendingStage || selectedAppIds.size === 0) return
    setMoving(true)
    const res = await fetch('/api/applications/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationIds: [...selectedAppIds], stage: pendingStage }),
    })
    setMoving(false)
    if (res.ok) {
      const data = await res.json()
      toast.success(`Moved ${data.updated} candidate${data.updated !== 1 ? 's' : ''} to ${STAGE_LABELS[pendingStage]}`)
      setPendingStage('')
      setSelectedAppIds(new Set())
      // Refresh the page to show updated stages
      window.location.reload()
    } else {
      toast.error('Failed to update stages.')
    }
  }

  if (candidates.length === 0) return null

  return (
    <>
      {/* ── Mobile card list ── */}
      <div className="sm:hidden card divide-y divide-gray-100 overflow-hidden">
        {candidates.map((candidate) => {
          const latestApp = candidate.applications[0]
          const targetApp = getTargetApp(candidate)
          const isSelected = targetApp ? selectedAppIds.has(targetApp.id) : false

          return (
            <div
              key={candidate.id}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
            >
              {targetApp && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCandidate(candidate)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 flex-shrink-0"
                />
              )}
              <Link
                href={`/candidates/${candidate.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#4AFFD2]/20 text-[#0e7a5c] text-sm font-semibold flex-shrink-0">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    {latestApp && isNewApplicant(latestApp.createdAt) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide flex-shrink-0">New</span>
                    )}
                    {candidate.blocked && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 flex-shrink-0">
                        <Ban className="w-2.5 h-2.5" /> DNC
                      </span>
                    )}
                  </div>
                  {candidate.applications.length > 0 ? (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {candidate.applications.map(a => a.job.title).join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">{candidate.email}</p>
                  )}
                  {targetApp && (
                    <span className={`inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${STAGE_COLORS[targetApp.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STAGE_LABELS[targetApp.stage] ?? targetApp.stage}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                    title="Select all"
                  />
                </th>
                <th>Name</th>
                <th>Role(s)</th>
                <th>Stage</th>
                <th className="hidden md:table-cell">Tags</th>
                <th className="hidden sm:table-cell">Email</th>
                <th className="hidden lg:table-cell">Phone</th>
                <th className="hidden lg:table-cell">Applied</th>
                <th className="hidden lg:table-cell">Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const latestApp = candidate.applications[0]
                const targetApp = getTargetApp(candidate)
                const isSelected = targetApp ? selectedAppIds.has(targetApp.id) : false

                return (
                  <tr key={candidate.id} className={isSelected ? 'bg-blue-50' : undefined}>
                    <td>
                      {targetApp && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCandidate(candidate)}
                          className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                        />
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4AFFD2]/20 text-[#0e7a5c] text-xs font-semibold flex-shrink-0">
                          {candidate.firstName[0]}{candidate.lastName[0]}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</span>
                          {latestApp && isNewApplicant(latestApp.createdAt) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">New</span>
                          )}
                          {candidate.blocked && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                              <Ban className="w-2.5 h-2.5" /> DNC
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.applications.length === 0 ? (
                          <span className="text-gray-400 text-sm">—</span>
                        ) : candidate.applications.map(app => {
                          const color = jobColorMap.get(app.job.id) ?? JOB_COLORS[0]
                          return (
                            <span key={app.id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${color.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
                              {app.job.title}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td>
                      {targetApp && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLORS[targetApp.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STAGE_LABELS[targetApp.stage] ?? targetApp.stage}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        {candidate.tags.slice(0, 3).map(ct => (
                          <span key={ct.tagId} className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ct.tag.color }} title={ct.tag.name} />
                        ))}
                        {candidate.tags.length > 3 && <span className="text-xs text-gray-400">+{candidate.tags.length - 3}</span>}
                        {candidate.tags.length === 0 && <span className="text-gray-300 text-sm">—</span>}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell text-gray-600">{candidate.email}</td>
                    <td className="hidden lg:table-cell text-gray-600">{candidate.phone || '—'}</td>
                    <td className="hidden lg:table-cell text-gray-500 text-sm">
                      {latestApp ? formatDate(latestApp.createdAt) : formatDate(candidate.createdAt)}
                    </td>
                    <td className="hidden lg:table-cell text-gray-600">{candidate.source || '—'}</td>
                    <td>
                      <Link href={`/candidates/${candidate.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {someSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pointer-events-none">
          <div className="pointer-events-auto bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 flex-wrap max-w-2xl w-full mx-4">

            {/* Count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold">{selectedAppIds.size} selected</span>
            </div>

            <div className="flex-1 h-px bg-gray-700 hidden sm:block" />

            {/* Move to stage */}
            <div className="flex items-center gap-2">
              <select
                value={pendingStage}
                onChange={e => setPendingStage(e.target.value)}
                className="text-sm bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4AFFD2]/40"
              >
                <option value="">Move to stage…</option>
                {MOVEABLE_STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={moveToStage}
                disabled={!pendingStage || moving}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#4AFFD2] text-gray-900 hover:bg-[#38e5ba] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {moving ? 'Moving…' : 'Move'}
              </button>
            </div>

            {/* Send message */}
            <button
              onClick={() => setMsgModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Send Message
            </button>

            {/* Clear */}
            <button
              onClick={() => setSelectedAppIds(new Set())}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk message modal ── */}
      {msgModalOpen && (
        <BulkMessageModal
          selectedApps={selectedApps}
          candidates={candidates}
          templates={templates}
          onClose={() => setMsgModalOpen(false)}
          onSent={() => { setMsgModalOpen(false); setSelectedAppIds(new Set()) }}
        />
      )}
    </>
  )
}
