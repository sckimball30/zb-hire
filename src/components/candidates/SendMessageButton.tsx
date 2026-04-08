'use client'

import { useState, useEffect, useMemo } from 'react'
import { Send, X, Clock, ChevronDown, User, Link2 } from 'lucide-react'
import { toast } from 'sonner'

type Template = { id: string; name: string; subject: string; body: string }
type InterviewerOption = { id: string; name: string; title: string | null; calendlyUrl: string | null }

interface Props {
  candidateId: string
  candidateEmail: string
  candidateFirstName?: string
  jobTitle?: string
  recruiterName?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addBusinessDays(days: number): Date {
  let date = new Date()
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return date
}

function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

/** Extract all {{...}} variable names from a string */
function extractVars(text: string): string[] {
  const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)]
  return [...new Set(matches.map(m => m[1].trim()))]
}

/** Variables that are auto-populated (both camelCase and "Display Name" forms) */
const AUTO_VAR_MAP: Record<string, string | null> = {
  'firstName': null,
  'First Name': null,
  'jobTitle': null,
  'Job Title': null,
  'recruiterName': null,
  'Recruiter Name': null,
  'Careers Page URL': null,
}

/** Variables driven by an interviewer dropdown (pairs — selecting interviewer fills both) */
const INTERVIEWER_NAME_VARS = ['Interviewer Name', 'interviewerName']
const INTERVIEWER_TITLE_VARS = ['Interviewer Title', 'interviewerTitle']
const CALENDLY_VARS = ['Calendly Link', 'calendlyLink']

function isInterviewerNameVar(v: string) { return INTERVIEWER_NAME_VARS.includes(v) }
function isInterviewerTitleVar(v: string) { return INTERVIEWER_TITLE_VARS.includes(v) }
function isCalendlyVar(v: string) { return CALENDLY_VARS.includes(v) }
function isAutoVar(v: string) { return v in AUTO_VAR_MAP }

/** Replace all occurrences of {{varName}} */
function replaceVar(text: string, varName: string, value: string): string {
  return text.replaceAll(`{{${varName}}}`, value)
}

/** Apply a map of varName → value to text */
function applyVars(text: string, vars: Record<string, string>): string {
  let out = text
  for (const [k, v] of Object.entries(vars)) {
    if (v) out = replaceVar(out, k, v)
  }
  return out
}

/** Highlight remaining unfilled {{vars}} in the preview */
function highlightVars(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, '<mark class="bg-yellow-100 text-yellow-800 rounded px-0.5">{{$1}}</mark>')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SendMessageButton({
  candidateId,
  candidateEmail,
  candidateFirstName,
  jobTitle,
  recruiterName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')

  // Raw template text (with vars still in it)
  const [rawSubject, setRawSubject] = useState('')
  const [rawBody, setRawBody] = useState('')

  // User-edited final subject/body (after variable substitution)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  // Variable values filled by user
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  // Dropdown selections
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>('')   // for Interviewer Name/Title
  const [selectedCalendlyId, setSelectedCalendlyId] = useState<string>('')         // for Calendly Link

  const [sending, setSending] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'schedule'>('now')
  const [delayDays, setDelayDays] = useState(1)
  const [showPreview, setShowPreview] = useState(false)

  const [careersPageUrl, setCareersPageUrl] = useState<string>('')

  // Load templates + interviewers + company settings when modal opens
  useEffect(() => {
    if (!open) return
    fetch('/api/messages/templates').then(r => r.json()).then(setTemplates)
    fetch('/api/interviewers').then(r => r.json()).then((data: InterviewerOption[]) => {
      setInterviewers(Array.isArray(data) ? data : [])
    })
    fetch('/api/settings/company').then(r => r.json()).then(data => {
      setCareersPageUrl(data.careersPageUrl ?? '')
    })
  }, [open])

  // ── Build auto-var map from props + company settings ──────────────────────
  const autoVars: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {}
    if (candidateFirstName) { m['firstName'] = candidateFirstName; m['First Name'] = candidateFirstName }
    if (jobTitle) { m['jobTitle'] = jobTitle; m['Job Title'] = jobTitle }
    if (recruiterName) { m['recruiterName'] = recruiterName; m['Recruiter Name'] = recruiterName }
    if (careersPageUrl) { m['Careers Page URL'] = careersPageUrl }
    return m
  }, [candidateFirstName, jobTitle, recruiterName, careersPageUrl])

  // ── Detect variables that need user input ─────────────────────────────────
  const manualVars = useMemo(() => {
    const allVars = [...extractVars(rawSubject), ...extractVars(rawBody)]
    return [...new Set(allVars)].filter(v => {
      // Auto-vars with a real value are handled automatically — skip them
      // Auto-vars WITHOUT a value (e.g. jobTitle not available) fall through to manual input
      if (isAutoVar(v) && autoVars[v]) return false
      if (isInterviewerNameVar(v) || isInterviewerTitleVar(v) || isCalendlyVar(v)) return false
      return true
    })
  }, [rawSubject, rawBody, autoVars])

  const needsInterviewerDropdown = useMemo(() =>
    [...extractVars(rawSubject), ...extractVars(rawBody)].some(v => isInterviewerNameVar(v) || isInterviewerTitleVar(v)),
    [rawSubject, rawBody]
  )

  const needsCalendlyDropdown = useMemo(() =>
    [...extractVars(rawSubject), ...extractVars(rawBody)].some(v => isCalendlyVar(v)),
    [rawSubject, rawBody]
  )

  const calendlyInterviewers = useMemo(() => interviewers.filter(i => i.calendlyUrl), [interviewers])

  // ── Rebuild body whenever any variable changes ─────────────────────────────
  useEffect(() => {
    if (!rawBody) return
    let s = rawSubject
    let b = rawBody

    // Auto vars
    s = applyVars(s, autoVars)
    b = applyVars(b, autoVars)

    // Interviewer Name + Title
    if (selectedInterviewerId) {
      const iv = interviewers.find(i => i.id === selectedInterviewerId)
      if (iv) {
        for (const v of INTERVIEWER_NAME_VARS) { s = replaceVar(s, v, iv.name); b = replaceVar(b, v, iv.name) }
        for (const v of INTERVIEWER_TITLE_VARS) {
          const t = iv.title ?? ''
          s = replaceVar(s, v, t); b = replaceVar(b, v, t)
        }
      }
    }

    // Calendly Link
    if (selectedCalendlyId) {
      const iv = interviewers.find(i => i.id === selectedCalendlyId)
      if (iv?.calendlyUrl) {
        for (const v of CALENDLY_VARS) { s = replaceVar(s, v, iv.calendlyUrl!); b = replaceVar(b, v, iv.calendlyUrl!) }
      }
    }

    // Manual vars
    for (const [k, v] of Object.entries(varValues)) {
      if (v) { s = replaceVar(s, k, v); b = replaceVar(b, k, v) }
    }

    setSubject(s)
    setBody(b)
  }, [rawSubject, rawBody, autoVars, selectedInterviewerId, selectedCalendlyId, varValues, interviewers])

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id)
    if (t) {
      setRawSubject(t.subject)
      setRawBody(t.body)
      setVarValues({})
      setSelectedInterviewerId('')
      setSelectedCalendlyId('')
      setShowPreview(false)
    }
    setSelectedTemplate(id)
  }

  function hasUnfilled(text: string) { return /\{\{[^}]+\}\}/.test(text) }

  async function send() {
    if (!subject.trim() || !body.trim()) return
    if (hasUnfilled(subject) || hasUnfilled(body)) {
      toast.warning('Fill in all highlighted variables before sending.')
      return
    }
    setSending(true)
    if (deliveryMode === 'now') {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, subject, body, templateId: selectedTemplate || undefined }),
      })
      setSending(false)
      if (res.ok) { toast.success('Message sent!'); closeAndReset() }
      else { const d = await res.json(); toast.error(d.error || 'Failed to send.') }
    } else {
      const res = await fetch('/api/messages/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, subject, body, templateId: selectedTemplate || undefined, delayDays }),
      })
      setSending(false)
      if (res.ok) {
        const data = await res.json()
        toast.success(`Scheduled for ${formatDeliveryDate(new Date(data.scheduledFor))}`)
        closeAndReset()
      } else { const d = await res.json(); toast.error(d.error || 'Failed to schedule.') }
    }
  }

  function closeAndReset() {
    setOpen(false); setSelectedTemplate(''); setRawSubject(''); setRawBody('')
    setSubject(''); setBody(''); setVarValues({}); setSelectedInterviewerId('')
    setSelectedCalendlyId(''); setDeliveryMode('now'); setDelayDays(1); setShowPreview(false)
  }

  const scheduledDate = deliveryMode === 'schedule' ? addBusinessDays(delayDays) : null
  const unfilledCount = [...extractVars(subject), ...extractVars(body)].length

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline text-xs flex items-center gap-1.5">
        <Send className="w-3.5 h-3.5" /> Send Message
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Send Message</h2>
                <p className="text-xs text-gray-400 mt-0.5">To: {candidateEmail}</p>
              </div>
              <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

              {/* Template picker */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use a template</label>
                  <select value={selectedTemplate} onChange={e => applyTemplate(e.target.value)} className="input w-full">
                    <option value="">— Choose a template —</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              {/* Variable filler — only shown when template has variables */}
              {selectedTemplate && (needsInterviewerDropdown || needsCalendlyDropdown || manualVars.length > 0) && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Fill in variables</p>

                  {/* Auto vars — only show chips for values that are actually filled */}
                  {(candidateFirstName || jobTitle) && (
                    <div className="flex flex-wrap gap-2">
                      {candidateFirstName && <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1 font-medium"><span className="opacity-60">First Name →</span> {candidateFirstName}</span>}
                      {jobTitle && <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1 font-medium"><span className="opacity-60">Job Title →</span> {jobTitle}</span>}
                    </div>
                  )}

                  {/* Interviewer Name + Title dropdown */}
                  {needsInterviewerDropdown && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Interviewer Name &amp; Title
                      </label>
                      <select
                        className="input text-sm"
                        value={selectedInterviewerId}
                        onChange={e => setSelectedInterviewerId(e.target.value)}
                      >
                        <option value="">— Select interviewer —</option>
                        {interviewers.map(i => (
                          <option key={i.id} value={i.id}>{i.name}{i.title ? ` — ${i.title}` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Calendly Link dropdown */}
                  {needsCalendlyDropdown && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" /> Calendly Link
                      </label>
                      {calendlyInterviewers.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                          No Calendly links saved yet. Add them on the <a href="/interviewers" className="underline" target="_blank">Interviewers page</a>.
                        </p>
                      ) : (
                        <select
                          className="input text-sm"
                          value={selectedCalendlyId}
                          onChange={e => setSelectedCalendlyId(e.target.value)}
                        >
                          <option value="">— Select whose link to use —</option>
                          {calendlyInterviewers.map(i => (
                            <option key={i.id} value={i.id}>{i.name} — {i.calendlyUrl}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Manual text inputs for all other vars */}
                  {manualVars.map(varName => (
                    <div key={varName}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{varName}</label>
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder={`Enter ${varName.toLowerCase()}…`}
                        value={varValues[varName] ?? ''}
                        onChange={e => setVarValues(prev => ({ ...prev, [varName]: e.target.value }))}
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
                  {subject && body && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(v => !v)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                      {showPreview ? 'Edit' : 'Preview'}
                    </button>
                  )}
                </div>

                {showPreview ? (
                  <div
                    className="border border-gray-200 rounded-lg p-3 text-sm text-gray-800 bg-gray-50 whitespace-pre-wrap leading-relaxed min-h-[120px]"
                    dangerouslySetInnerHTML={{ __html: highlightVars(body) }}
                  />
                ) : (
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={8}
                    className="input w-full resize-none text-sm"
                    placeholder="Write your message…"
                  />
                )}

                {unfilledCount > 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    ⚠ {unfilledCount} variable{unfilledCount > 1 ? 's' : ''} still need to be filled in
                  </p>
                )}
              </div>

              {/* Delivery */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Delivery</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryMode" value="now" checked={deliveryMode === 'now'}
                      onChange={() => setDeliveryMode('now')} className="accent-blue-600" />
                    <span className="text-sm text-gray-700">Send now</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryMode" value="schedule" checked={deliveryMode === 'schedule'}
                      onChange={() => setDeliveryMode('schedule')} className="accent-blue-600" />
                    <span className="text-sm text-gray-700">Schedule delivery</span>
                  </label>
                </div>
                {deliveryMode === 'schedule' && (
                  <div className="space-y-2">
                    <select value={delayDays} onChange={e => setDelayDays(Number(e.target.value))} className="input w-full">
                      {[1,2,3,4,5].map(d => <option key={d} value={d}>{d} business day{d > 1 ? 's' : ''} from now</option>)}
                    </select>
                    {scheduledDate && <p className="text-xs text-gray-500">Delivers: {formatDeliveryDate(scheduledDate)}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button onClick={closeAndReset} className="btn-outline">Cancel</button>
              <button
                onClick={send}
                disabled={sending || !subject.trim() || !body.trim()}
                className="btn-primary flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending
                  ? (deliveryMode === 'schedule' ? 'Scheduling…' : 'Sending…')
                  : (deliveryMode === 'schedule' ? 'Schedule' : 'Send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
