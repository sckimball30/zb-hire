'use client'

import { useState } from 'react'
import { X, User } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CandidateData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  linkedInUrl: string | null
  source: string | null
  notes: string | null
}

interface Props {
  candidate: CandidateData
  onClose: () => void
}

const SOURCES = ['LinkedIn', 'Referral', 'Indeed', 'Job Board', 'Direct', 'Other']

export function EditCandidateModal({ candidate, onClose }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName:  candidate.firstName,
    lastName:   candidate.lastName,
    email:      candidate.email,
    phone:      candidate.phone ?? '',
    linkedInUrl: candidate.linkedInUrl ?? '',
    source:     candidate.source ?? '',
    notes:      candidate.notes ?? '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('First name, last name, and email are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:  form.firstName.trim(),
          lastName:   form.lastName.trim(),
          email:      form.email.trim(),
          phone:      form.phone.trim() || null,
          linkedInUrl: form.linkedInUrl.trim() || null,
          source:     form.source || null,
          notes:      form.notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      toast.success('Candidate updated')
      onClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit Candidate</h2>
              <p className="text-xs text-gray-400 mt-0.5">{candidate.firstName} {candidate.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                className={inputCls}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                className={inputCls}
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className={inputCls}
              placeholder="jane.smith@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className={inputCls}
                placeholder="415-555-0100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={e => set('source', e.target.value)}
                className={inputCls + ' bg-white'}
              >
                <option value="">Select source…</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={form.linkedInUrl}
              onChange={e => set('linkedInUrl', e.target.value)}
              className={inputCls}
              placeholder="https://linkedin.com/in/…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className={inputCls + ' resize-none'}
              placeholder="Any notes about this candidate…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </div>
    </div>
  )
}
