'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Copy, ExternalLink, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const INTERVIEW_TYPES = [
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'VIDEO_CALL', label: 'Video Call' },
  { value: 'TECHNICAL', label: 'Technical Interview' },
  { value: 'ONSITE', label: 'On-Site Interview' },
  { value: 'PANEL', label: 'Panel Interview' },
  { value: 'FINAL', label: 'Final Round' },
]

const DURATIONS = [15, 30, 45, 60, 90, 120]

interface Interviewer {
  id: string
  name: string
  title: string | null
  calendlyUrl: string | null
}

interface Props {
  applicationId: string
  interviewers: Interviewer[]
  onClose: () => void
}

export function ScheduleInterviewModal({ applicationId, interviewers, onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    interviewerId: interviewers[0]?.id ?? '',
    type: 'PHONE_SCREEN',
    durationMins: 60,
    scheduledAt: '',
    location: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedInterviewer = interviewers.find(i => i.id === form.interviewerId)
  const calendlyUrl = selectedInterviewer?.calendlyUrl ?? null

  useEffect(() => {
    setCopied(false)
  }, [form.interviewerId])

  const copyCalendlyLink = async () => {
    if (!calendlyUrl) return
    await navigator.clipboard.writeText(calendlyUrl)
    setCopied(true)
    toast.success('Calendly link copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.interviewerId) {
      toast.error('Please select an interviewer')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerId: form.interviewerId,
          type: form.type,
          durationMins: form.durationMins,
          scheduledAt: form.scheduledAt || null,
          location: form.location || null,
          notes: form.notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to schedule interview')
      }

      toast.success('Interview scheduled!')
      onClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4AFFD2]/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#111]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Schedule Interview</h2>
              <p className="text-xs text-gray-400">Log an interview and get the Calendly link</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Interview Type */}
          <div>
            <label className="label">Interview Type</label>
            <select
              className="input"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            >
              {INTERVIEW_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Interviewer */}
          <div>
            <label className="label">Interviewer</label>
            {interviewers.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                No interviewers assigned to this job yet. Go to the job page to assign interviewers first.
              </p>
            ) : (
              <select
                className="input"
                value={form.interviewerId}
                onChange={e => setForm(p => ({ ...p, interviewerId: e.target.value }))}
              >
                {interviewers.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}{i.title ? ` — ${i.title}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Calendly section */}
          {selectedInterviewer && (
            <div className={`rounded-xl border-2 p-4 ${calendlyUrl ? 'border-[#4AFFD2]/40 bg-[#4AFFD2]/5' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Link2 className={`w-4 h-4 ${calendlyUrl ? 'text-[#111]' : 'text-gray-300'}`} />
                <span className="text-sm font-medium text-gray-700">Calendly Scheduling Link</span>
              </div>

              {calendlyUrl ? (
                <>
                  <p className="text-xs text-gray-500 mb-3 break-all">{calendlyUrl}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyCalendlyLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4AFFD2] text-[#111] text-xs font-semibold hover:bg-[#4AFFD2]/80 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a
                      href={calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Calendly
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Copy this link and send it to the candidate so they can self-schedule.</p>
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  {selectedInterviewer.name} doesn't have a Calendly link set up yet.
                  Add one on the <a href="/interviewers" target="_blank" className="text-blue-600 hover:underline">Interviewers page</a>.
                </p>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="label">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, durationMins: d }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.durationMins === d
                      ? 'bg-[#111] text-white border-[#111]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {d < 60 ? `${d}m` : `${d / 60}h${d % 60 ? `${d % 60}m` : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Date/Time (optional) */}
          <div>
            <label className="label">Date & Time <span className="text-gray-400 font-normal">(optional — fill in once confirmed)</span></label>
            <input
              type="datetime-local"
              className="input"
              value={form.scheduledAt}
              onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
            />
          </div>

          {/* Location */}
          <div>
            <label className="label">Location / Link <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Zoom link, conference room..."
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any prep notes or context..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || interviewers.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Scheduling...' : 'Log Interview'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
