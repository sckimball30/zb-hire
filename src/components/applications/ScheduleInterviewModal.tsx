'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const INTERVIEW_TYPES = [
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'VIDEO_CALL',   label: 'Video Call'   },
  { value: 'TECHNICAL',   label: 'Technical'     },
  { value: 'ONSITE',      label: 'On-Site'       },
  { value: 'PANEL',       label: 'Panel'         },
  { value: 'FINAL',       label: 'Final Round'   },
]

const LOCATION_PRESETS = [
  { label: 'Google Meet', value: 'Google Meet' },
  { label: 'Zoom',        value: 'Zoom'        },
  { label: 'Phone Call',  value: 'Phone Call'  },
  { label: 'On-Site',     value: 'On-Site'     },
]

interface Interviewer {
  id: string
  name: string
  title: string | null
  calendlyUrl: string | null
}

interface Props {
  applicationId: string
  interviewers: Interviewer[]
  candidateId?: string
  candidateEmail?: string
  candidateFirstName?: string
  jobTitle?: string
  onClose: () => void
}

export function ScheduleInterviewModal({
  applicationId,
  interviewers,
  onClose,
}: Props) {
  const router = useRouter()

  const [interviewerId, setInterviewerId] = useState(interviewers[0]?.id ?? '')
  const [type, setType] = useState('PHONE_SCREEN')
  const [location, setLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [loading, setLoading] = useState(false)

  const effectiveLocation = location === '__custom__' ? customLocation : location

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interviewerId) { toast.error('Please select an interviewer'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerId,
          type,
          durationMins: 60,
          scheduledAt: scheduledAt || null,
          location: effectiveLocation || null,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to log interview')
      }
      toast.success('Interview logged!')
      onClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Log Interview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track interview progress for the team</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Interviewer */}
          <div>
            <label className="label">Interviewer</label>
            {interviewers.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                No interviewers assigned to this job yet. Add them on the job's Team tab first.
              </p>
            ) : (
              <select
                className="input"
                value={interviewerId}
                onChange={e => setInterviewerId(e.target.value)}
                required
              >
                <option value="">Select interviewer…</option>
                {interviewers.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}{i.title ? ` — ${i.title}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Interview Type */}
          <div>
            <label className="label">Interview Type</label>
            <div className="flex flex-wrap gap-2">
              {INTERVIEW_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    type === t.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> Where
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {LOCATION_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setLocation(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    location === p.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setLocation('__custom__')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  location === '__custom__'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                Other…
              </button>
            </div>
            {location === '__custom__' && (
              <input
                type="text"
                className="input"
                placeholder="e.g. Conference Room B, specific Zoom link…"
                value={customLocation}
                onChange={e => setCustomLocation(e.target.value)}
              />
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className="label">
              Date &amp; Time
              <span className="ml-2 text-xs font-normal text-gray-400">
                — leave blank, fill in once confirmed
              </span>
            </label>
            <input
              type="datetime-local"
              className="input"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
            />
            {!scheduledAt && (
              <p className="text-xs text-amber-600 mt-1">
                No time set yet — the interview will show as <em>Awaiting confirmation</em> in the sidebar.
              </p>
            )}
          </div>

          {/* Notes — collapsed by default */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(v => !v)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showNotes ? 'Hide notes' : 'Add notes (optional)'}
            </button>
            {showNotes && (
              <textarea
                className="input resize-none mt-2"
                rows={3}
                placeholder="Any context or prep notes for the team…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || interviewers.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving…' : 'Log Interview'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
