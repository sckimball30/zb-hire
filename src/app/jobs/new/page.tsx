'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

function parseMoney(val: string): number | undefined {
  const clean = val.replace(/[$,\s]/g, '')
  const n = parseInt(clean, 10)
  return isNaN(n) ? undefined : n
}

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [compMode, setCompMode] = useState<'fixed' | 'range'>('range')
  const [form, setForm] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    status: 'DRAFT' as 'DRAFT' | 'OPEN',
    hiringGoal: '',
    employmentType: '',
    payType: 'SALARY',
    salaryFixed: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Job title is required')
      return
    }

    const salaryMin = compMode === 'fixed' ? parseMoney(form.salaryFixed) : parseMoney(form.salaryMin)
    const salaryMax = compMode === 'fixed' ? parseMoney(form.salaryFixed) : parseMoney(form.salaryMax)

    setLoading(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          department: form.department || undefined,
          location: form.location || undefined,
          description: form.description || undefined,
          status: form.status,
          hiringGoal: form.hiringGoal ? parseInt(form.hiringGoal) : undefined,
          employmentType: form.employmentType || undefined,
          payType: form.payType,
          salaryMin,
          salaryMax,
          salaryCurrency: form.salaryCurrency,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create job')
      }

      const job = await res.json()
      toast.success('Job created successfully')
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  const payLabel = form.payType === 'HOURLY' ? 'Hourly Rate' : 'Salary'

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/jobs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <h1 className="page-title">Create New Job</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div>
            <label htmlFor="title" className="label">Job Title <span className="text-red-500">*</span></label>
            <input
              id="title" name="title" type="text" className="input"
              placeholder="e.g. Senior Software Engineer"
              value={form.title} onChange={handleChange} required
            />
          </div>

          {/* Department + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="label">Department</label>
              <input id="department" name="department" type="text" className="input"
                placeholder="e.g. Sales" value={form.department} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="location" className="label">Location</label>
              <input id="location" name="location" type="text" className="input"
                placeholder="e.g. Remote" value={form.location} onChange={handleChange} />
            </div>
          </div>

          {/* Employment Type + Pay Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="employmentType" className="label">Employment Type</label>
              <select id="employmentType" name="employmentType" className="input"
                value={form.employmentType} onChange={handleChange}>
                <option value="">— Select —</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="TEMPORARY">Temporary</option>
              </select>
            </div>
            <div>
              <label htmlFor="payType" className="label">Pay Type</label>
              <select id="payType" name="payType" className="input"
                value={form.payType} onChange={handleChange}>
                <option value="SALARY">Salary (annual)</option>
                <option value="HOURLY">Hourly</option>
              </select>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{payLabel}</label>
              {/* Fixed vs Range toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setCompMode('fixed')}
                  className={`px-3 py-1 font-medium transition-colors ${compMode === 'fixed' ? 'bg-[#111] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setCompMode('range')}
                  className={`px-3 py-1 font-medium transition-colors ${compMode === 'range' ? 'bg-[#111] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Range
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select name="salaryCurrency" className="input w-20 flex-shrink-0"
                value={form.salaryCurrency} onChange={handleChange}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>

              {compMode === 'fixed' ? (
                <input
                  name="salaryFixed" type="text" className="input flex-1"
                  placeholder={form.payType === 'HOURLY' ? 'e.g. 18 or $18.50' : 'e.g. 37,440 or $95,000'}
                  value={form.salaryFixed} onChange={handleChange}
                />
              ) : (
                <>
                  <input
                    name="salaryMin" type="text" className="input flex-1"
                    placeholder={form.payType === 'HOURLY' ? 'Min (e.g. 15)' : 'Min (e.g. 80,000)'}
                    value={form.salaryMin} onChange={handleChange}
                  />
                  <span className="text-gray-400 text-sm flex-shrink-0">to</span>
                  <input
                    name="salaryMax" type="text" className="input flex-1"
                    placeholder={form.payType === 'HOURLY' ? 'Max (e.g. 25)' : 'Max (e.g. 120,000)'}
                    value={form.salaryMax} onChange={handleChange}
                  />
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Commas and $ signs are fine — visible internally only</p>
          </div>

          {/* Hiring Goal + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hiringGoal" className="label">Hiring Goal</label>
              <input id="hiringGoal" name="hiringGoal" type="number" min="1" className="input"
                placeholder="e.g. 2" value={form.hiringGoal} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="status" className="label">Status</label>
              <select id="status" name="status" className="input"
                value={form.status} onChange={handleChange}>
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description" name="description" rows={5} className="input h-auto"
              placeholder="Describe the role, responsibilities, and requirements..."
              value={form.description} onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Job'}
            </button>
            <Link href="/jobs" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
