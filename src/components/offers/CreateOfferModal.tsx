'use client'

import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  applicationId: string
  jobTitle: string
  onClose: () => void
  // When editing an existing offer
  existingOffer?: {
    id: string
    jobTitle: string
    salary: number | null
    salaryType: string
    currency: string
    startDate: string | null
    expiresAt: string | null
    notes: string | null
    employmentType: string | null
    bonus: string | null
  }
}

function toInputDate(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export function CreateOfferModal({ applicationId, jobTitle, onClose, existingOffer }: Props) {
  const router = useRouter()
  const isEditing = !!existingOffer

  const [form, setForm] = useState({
    jobTitle: existingOffer?.jobTitle || jobTitle,
    employmentType: existingOffer?.employmentType || '',
    salary: existingOffer?.salary?.toString() || '',
    salaryType: existingOffer?.salaryType || 'ANNUAL',
    currency: existingOffer?.currency || 'USD',
    startDate: toInputDate(existingOffer?.startDate),
    expiresAt: toInputDate(existingOffer?.expiresAt),
    notes: existingOffer?.notes || '',
    bonus: existingOffer?.bonus || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.jobTitle.trim()) {
      toast.error('Job title is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        jobTitle: form.jobTitle.trim(),
        employmentType: form.employmentType || null,
        salary: form.salary ? Number(form.salary) : null,
        salaryType: form.salaryType,
        currency: form.currency,
        startDate: form.startDate || null,
        expiresAt: form.expiresAt || null,
        notes: form.notes.trim() || null,
        bonus: form.bonus.trim() || null,
      }

      let res: Response
      if (isEditing) {
        res = await fetch(`/api/offers/${existingOffer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, ...payload }),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save offer')
      }

      toast.success(isEditing ? 'Offer updated!' : 'Offer created as draft!')
      onClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4AFFD2]/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#111]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEditing ? 'Edit Offer' : 'Create Offer'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing ? 'Update offer details' : 'Offer will be saved as a draft'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Job Title */}
          <div>
            <label className="label">Job Title</label>
            <input
              type="text"
              className="input"
              value={form.jobTitle}
              onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
              placeholder="e.g. Senior Frontend Engineer"
              required
            />
          </div>

          {/* Employment Type */}
          <div>
            <label className="label">Employment Type <span className="text-gray-400 font-normal">(optional)</span></label>
            <select
              className="input"
              value={form.employmentType}
              onChange={e => setForm(p => ({ ...p, employmentType: e.target.value }))}
            >
              <option value="">— Select —</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
            </select>
          </div>

          {/* Salary + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Salary</label>
              <input
                type="number"
                className="input"
                value={form.salary}
                onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                placeholder="e.g. 95000"
                min="0"
              />
            </div>
            <div>
              <label className="label">Salary Type</label>
              <select
                className="input"
                value={form.salaryType}
                onChange={e => setForm(p => ({ ...p, salaryType: e.target.value }))}
              >
                <option value="ANNUAL">Annual</option>
                <option value="HOURLY">Hourly</option>
              </select>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="label">Start Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
            />
          </div>

          {/* Offer Expiry */}
          <div>
            <label className="label">Offer Expiry Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="date"
              className="input"
              value={form.expiresAt}
              onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Additional Terms / Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Benefits package, equity, signing bonus details..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          {/* Bonus Structure */}
          <div>
            <label className="label">Bonus Structure <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Annual performance bonus up to 10% of base salary"
              value={form.bonus}
              onChange={e => setForm(p => ({ ...p, bonus: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Draft Offer')}
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
