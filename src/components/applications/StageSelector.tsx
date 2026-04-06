'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, X, AlertTriangle, Send } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, ALL_STAGES } from '@/lib/constants'
import type { CandidateStage } from '@/types'

type Template = { id: string; name: string; subject: string; body: string }

interface StageSelectorProps {
  applicationId: string
  currentStage: CandidateStage
  candidateId?: string
  candidateEmail?: string
  candidateFirstName?: string
  jobTitle?: string
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

function applyVars(text: string, vars: Record<string, string>): string {
  let out = text
  for (const [k, v] of Object.entries(vars)) {
    if (v) out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

export function StageSelector({
  applicationId,
  currentStage,
  candidateId,
  candidateEmail,
  candidateFirstName,
  jobTitle,
}: StageSelectorProps) {
  const router = useRouter()
  const [stage, setStage] = useState(currentStage)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Rejection confirmation modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [sendEmail, setSendEmail] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [delayDays, setDelayDays] = useState(2)
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'schedule'>('schedule')
  const [confirming, setConfirming] = useState(false)

  // Load templates when modal opens
  useEffect(() => {
    if (!showRejectModal) return
    fetch('/api/messages/templates')
      .then(r => r.json())
      .then((all: Template[]) => {
        setTemplates(all)
        // Auto-select a rejection template based on current stage
        const postOnsite = all.find(t => t.name.toLowerCase().includes('post on-site') || t.name.toLowerCase().includes('onsite'))
        const postPhone = all.find(t => t.name.toLowerCase().includes('post phone') || t.name.toLowerCase().includes('phone screen'))
        const anyRejection = all.find(t => t.name.toLowerCase().includes('reject'))
        const autoSelect = (stage === 'ONSITE' ? postOnsite : postPhone) ?? anyRejection
        if (autoSelect) setSelectedTemplateId(autoSelect.id)
      })
  }, [showRejectModal, stage])

  const handleStageChange = async (newStage: CandidateStage) => {
    if (newStage === stage) { setOpen(false); return }

    // Intercept REJECTED — show confirmation modal
    if (newStage === 'REJECTED') {
      setOpen(false)
      setShowRejectModal(true)
      return
    }

    await commitStageChange(newStage)
  }

  const commitStageChange = async (newStage: CandidateStage) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update stage')
      }
      setStage(newStage)
      toast.success(`Stage updated to ${STAGE_LABELS[newStage]}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update stage')
    } finally {
      setLoading(false)
    }
  }

  const confirmRejection = async () => {
    setConfirming(true)
    try {
      // 1. Update stage
      await commitStageChange('REJECTED')

      // 2. Optionally send rejection email
      if (sendEmail && candidateId && selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId)
        if (template) {
          const autoVars: Record<string, string> = {}
          if (candidateFirstName) { autoVars['First Name'] = candidateFirstName; autoVars['firstName'] = candidateFirstName }
          if (jobTitle) { autoVars['Job Title'] = jobTitle; autoVars['jobTitle'] = jobTitle }

          const subject = applyVars(template.subject, autoVars)
          const body = applyVars(template.body, autoVars)

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
              const d = new Date(data.scheduledFor)
              const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              toast.success(`Rejection email scheduled for ${label}.`)
            }
          }
        }
      }

      setShowRejectModal(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setConfirming(false)
    }
  }

  const rejectionTemplates = templates.filter(t => t.name.toLowerCase().includes('reject'))
  const scheduledDate = deliveryMode === 'schedule' ? addBusinessDays(delayDays) : null

  return (
    <>
      {/* Stage dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${STAGE_COLORS[stage]} cursor-pointer border-2 border-transparent hover:border-current transition-colors`}
        >
          {loading ? 'Updating...' : STAGE_LABELS[stage]}
          <ChevronDown className="w-3 h-3" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
              {ALL_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStageChange(s)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${s === stage ? 'font-medium' : ''} ${s === 'REJECTED' ? 'text-red-600 hover:bg-red-50' : ''}`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${STAGE_COLORS[s].split(' ')[0]}`} />
                  {STAGE_LABELS[s]}
                  {s === stage && <span className="ml-auto text-blue-600">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Rejection confirmation modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
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
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Send rejection email toggle */}
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
                  {/* Template selector */}
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

                  {/* Delivery timing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">When to send</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('schedule')}
                        className={`flex-1 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${deliveryMode === 'schedule' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        Delay send
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('now')}
                        className={`flex-1 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${deliveryMode === 'now' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        Send now
                      </button>
                    </div>

                    {deliveryMode === 'schedule' && (
                      <div className="mt-2 space-y-1">
                        <select
                          className="input w-full text-sm"
                          value={delayDays}
                          onChange={e => setDelayDays(Number(e.target.value))}
                        >
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

                  {/* Any unfilled vars warning */}
                  {selectedTemplateId && (() => {
                    const t = templates.find(t => t.id === selectedTemplateId)
                    const remaining = (t?.body ?? '').match(/\{\{(?!First Name|Job Title|firstName|jobTitle)[^}]+\}\}/g)
                    return remaining?.length ? (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        ⚠ This template has variables like <strong>{remaining[0]}</strong> that won't be auto-filled. You can edit the template or send manually for a personalized message.
                      </p>
                    ) : null
                  })()}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={confirmRejection}
                disabled={confirming || (sendEmail && !selectedTemplateId && rejectionTemplates.length > 0)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {confirming ? 'Processing…' : (
                  <>
                    {sendEmail && <Send className="w-3.5 h-3.5" />}
                    {sendEmail ? 'Reject & Send Email' : 'Confirm Rejection'}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
