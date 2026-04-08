'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, AlertTriangle, Send } from 'lucide-react'
import { toast } from 'sonner'

type Template = { id: string; name: string; subject: string; body: string }

interface Props {
  candidateFirstName?: string
  candidateId?: string
  jobTitle?: string
  currentStage?: string          // used to auto-select the right rejection template
  onConfirm: () => Promise<void> // caller handles the actual stage update
  onCancel: () => void
}

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

function extractVars(text: string): string[] {
  const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)]
  return [...new Set(matches.map(m => m[1].trim()))]
}

function applyVars(text: string, vars: Record<string, string>): string {
  let out = text
  for (const [k, v] of Object.entries(vars)) {
    if (v) out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

const AUTO_VAR_NAMES = ['First Name', 'firstName', 'Job Title', 'jobTitle']

export function RejectionModal({
  candidateFirstName,
  candidateId,
  jobTitle,
  currentStage,
  onConfirm,
  onCancel,
}: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [sendEmail, setSendEmail] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'schedule'>('schedule')
  const [delayDays, setDelayDays] = useState(2)
  const [saving, setSaving] = useState(false)
  const [manualVarValues, setManualVarValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/messages/templates')
      .then(r => r.json())
      .then((all: Template[]) => {
        setTemplates(all)
        const preScreen   = all.find(t => t.name.toLowerCase().includes('pre-screening') || t.name.toLowerCase().includes('pre screening'))
        const postOnsite  = all.find(t => t.name.toLowerCase().includes('post on-site') || t.name.toLowerCase().includes('post onsite'))
        const postPhone   = all.find(t => t.name.toLowerCase().includes('post phone')   || t.name.toLowerCase().includes('phone screen'))
        const anyReject   = all.find(t => t.name.toLowerCase().includes('reject'))
        const auto = (
          currentStage === 'APPLIED'  ? (preScreen ?? anyReject) :
          currentStage === 'ONSITE'   ? (postOnsite ?? anyReject) :
          postPhone ?? anyReject
        )
        if (auto) setSelectedTemplateId(auto.id)
      })
  }, [currentStage])

  // Reset manual vars whenever template changes
  useEffect(() => {
    setManualVarValues({})
  }, [selectedTemplateId])

  const rejectionTemplates = templates.filter(t => t.name.toLowerCase().includes('reject'))
  const scheduledDate = deliveryMode === 'schedule' ? addBusinessDays(delayDays) : null

  // Build the set of auto vars that are actually available
  const autoVars = useMemo(() => {
    const m: Record<string, string> = {}
    if (candidateFirstName) { m['firstName'] = candidateFirstName; m['First Name'] = candidateFirstName }
    if (jobTitle)           { m['jobTitle']  = jobTitle;           m['Job Title']  = jobTitle }
    return m
  }, [candidateFirstName, jobTitle])

  // Manual vars = any var that isn't auto-filled
  const manualVars = useMemo(() => {
    if (!selectedTemplateId) return []
    const t = templates.find(t => t.id === selectedTemplateId)
    if (!t) return []
    const allVars = [...extractVars(t.subject), ...extractVars(t.body)]
    return [...new Set(allVars)].filter(v => !(AUTO_VAR_NAMES.includes(v) && autoVars[v]))
  }, [selectedTemplateId, templates, autoVars])

  const hasUnfilled = manualVars.some(v => !manualVarValues[v]?.trim())

  const handleConfirm = async () => {
    if (sendEmail && selectedTemplateId && hasUnfilled) {
      toast.warning('Fill in all variables before sending.')
      return
    }
    setSaving(true)
    try {
      await onConfirm()

      if (sendEmail && candidateId && selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId)
        if (template) {
          const vars: Record<string, string> = { ...autoVars, ...manualVarValues }
          const subject = applyVars(template.subject, vars)
          const body    = applyVars(template.body,    vars)

          if (deliveryMode === 'now') {
            await fetch('/api/messages/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ candidateId, subject, body, templateId: selectedTemplateId }),
            })
            toast.success('Rejection email sent.')
          } else {
            const res = await fetch('/api/messages/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ candidateId, subject, body, templateId: selectedTemplateId, delayDays }),
            })
            if (res.ok) {
              const data = await res.json()
              const label = new Date(data.scheduledFor).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              toast.success(`Rejection email scheduled for ${label}.`)
            }
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
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
            <h2 className="text-base font-semibold text-gray-900">Move to Rejected?</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {candidateFirstName
                ? `This will mark ${candidateFirstName}'s application as rejected.`
                : 'This will mark this application as rejected.'}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Send email toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">Send rejection email</p>
              <p className="text-xs text-gray-400 mt-0.5">Automatically notify the candidate</p>
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
            <>
              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection template</label>
                {rejectionTemplates.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    No rejection templates found. <a href="/messages/templates" className="underline">Create one</a> first.
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
              </div>

              {/* Auto-filled vars (read-only chips) */}
              {selectedTemplateId && (candidateFirstName || jobTitle) && (
                <div className="flex flex-wrap gap-2">
                  {candidateFirstName && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1 font-medium">
                      <span className="opacity-60">First Name →</span> {candidateFirstName}
                    </span>
                  )}
                  {jobTitle && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1 font-medium">
                      <span className="opacity-60">Job Title →</span> {jobTitle}
                    </span>
                  )}
                </div>
              )}

              {/* Manual variable inputs */}
              {manualVars.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Fill in before sending</p>
                  {manualVars.map(varName => (
                    <div key={varName}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{varName}</label>
                      <input
                        type="text"
                        className="input text-sm w-full"
                        placeholder={`Enter ${varName.toLowerCase()}…`}
                        value={manualVarValues[varName] ?? ''}
                        onChange={e => setManualVarValues(prev => ({ ...prev, [varName]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When to send</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDeliveryMode('schedule')}
                    className={`flex-1 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${deliveryMode === 'schedule' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    Delay send
                  </button>
                  <button type="button" onClick={() => setDeliveryMode('now')}
                    className={`flex-1 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${deliveryMode === 'now' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    Send now
                  </button>
                </div>
                {deliveryMode === 'schedule' && (
                  <div className="mt-2 space-y-1">
                    <select className="input w-full text-sm" value={delayDays} onChange={e => setDelayDays(Number(e.target.value))}>
                      {[1,2,3,4,5].map(d => (
                        <option key={d} value={d}>{d} business day{d > 1 ? 's' : ''} from now</option>
                      ))}
                    </select>
                    {scheduledDate && (
                      <p className="text-xs text-gray-500">
                        Sends: {scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={saving || (sendEmail && !selectedTemplateId && rejectionTemplates.length > 0) || (sendEmail && hasUnfilled)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Processing…' : (
              <>{sendEmail && <Send className="w-3.5 h-3.5" />}
              {sendEmail ? 'Reject & Send Email' : 'Confirm Rejection'}</>
            )}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
