'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Save, ExternalLink, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

type Job = {
  id: string
  title: string
  department: string | null
  location: string | null
  description: string | null
  status: string
  employmentType: string | null
  payType: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  hiringGoal: number | null
  interviewCount: number
}

interface EditJobModalProps {
  job: Job
  onClose: () => void
}

const STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'OPEN', label: 'Open', color: 'bg-green-100 text-green-700' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-red-100 text-red-700' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-slate-100 text-slate-600' },
]

export function EditJobModal({ job, onClose }: EditJobModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    title: job.title,
    department: job.department ?? '',
    location: job.location ?? '',
    description: job.description ?? '',
    status: job.status,
    employmentType: job.employmentType ?? '',
    payType: job.payType ?? 'SALARY',
    salaryMin: job.salaryMin?.toString() ?? '',
    salaryMax: job.salaryMax?.toString() ?? '',
    salaryCurrency: job.salaryCurrency ?? 'USD',
    hiringGoal: job.hiringGoal?.toString() ?? '',
    interviewCount: job.interviewCount?.toString() ?? '3',
  })

  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const applyUrl = `${origin}/apply/${job.id}`

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function save() {
    if (!form.title.trim()) { toast.error('Job title is required.'); return }
    setSaving(true)
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        department: form.department || null,
        location: form.location || null,
        description: form.description || null,
        status: form.status,
        employmentType: form.employmentType || null,
        payType: form.payType || null,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
        salaryCurrency: form.salaryCurrency,
        hiringGoal: form.hiringGoal ? parseInt(form.hiringGoal) : null,
        interviewCount: form.interviewCount ? parseInt(form.interviewCount) : 3,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Job updated.')
      router.refresh()
      onClose()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to update job.')
    }
  }

  function copyApplyLink() {
    navigator.clipboard.writeText(applyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Edit Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Status — prominent at top */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('status', s.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    form.status === s.value
                      ? `${s.color} border-current`
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {form.status === 'OPEN' && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-800 mb-0.5">Public apply link</p>
                  <p className="text-xs text-green-700 truncate">{applyUrl}</p>
                </div>
                <button onClick={copyApplyLink} className="flex-shrink-0 text-green-600 hover:text-green-800 p-1">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-green-600 hover:text-green-800 p-1">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="input w-full" placeholder="e.g. Sales Manager" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input value={form.department} onChange={e => set('department', e.target.value)}
                className="input w-full" placeholder="e.g. Sales" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                className="input w-full" placeholder="e.g. Remote" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)} className="input w-full">
                <option value="">— Select —</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="TEMPORARY">Temporary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Type</label>
              <select value={form.payType} onChange={e => set('payType', e.target.value)} className="input w-full">
                <option value="SALARY">Salary (annual)</option>
                <option value="HOURLY">Hourly</option>
              </select>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.payType === 'HOURLY' ? 'Hourly Rate Range' : 'Salary Range'}
            </label>
            <div className="flex items-center gap-2">
              <select value={form.salaryCurrency} onChange={e => set('salaryCurrency', e.target.value)}
                className="input w-20 flex-shrink-0">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
              <input type="number" min="0" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)}
                className="input flex-1"
                placeholder={form.payType === 'HOURLY' ? 'Min (e.g. 20)' : 'Min (e.g. 80000)'} />
              <span className="text-gray-400 text-sm flex-shrink-0">to</span>
              <input type="number" min="0" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)}
                className="input flex-1"
                placeholder={form.payType === 'HOURLY' ? 'Max (e.g. 35)' : 'Max (e.g. 120000)'} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Visible internally only</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Goal</label>
              <input type="number" min="1" value={form.hiringGoal} onChange={e => set('hiringGoal', e.target.value)}
                className="input w-full" placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Interviews</label>
              <input type="number" min="1" max="10" value={form.interviewCount} onChange={e => set('interviewCount', e.target.value)}
                className="input w-full" placeholder="e.g. 3" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={5} className="input w-full resize-none text-sm"
              placeholder="Describe the role, responsibilities, and requirements…" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
