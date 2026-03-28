'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function NewCandidatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedInUrl: '',
    source: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('First name, last name, and email are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          linkedInUrl: form.linkedInUrl || undefined,
          source: form.source || undefined,
          notes: form.notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create candidate')
      }

      const candidate = await res.json()

      // If we came from a job page, create an application
      if (jobId) {
        const appRes = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, jobId }),
        })
        if (appRes.ok) {
          const app = await appRes.json()
          toast.success('Candidate added to pipeline')
          router.push(`/applications/${app.id}`)
          return
        }
      }

      toast.success('Candidate created successfully')
      router.push(`/candidates/${candidate.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create candidate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={jobId ? `/jobs/${jobId}` : '/candidates'}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {jobId ? 'Back to Pipeline' : 'Back to Candidates'}
        </Link>
        <h1 className="page-title">Add Candidate</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">First Name <span className="text-red-500">*</span></label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="input"
                placeholder="Jane"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name <span className="text-red-500">*</span></label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="input"
                placeholder="Smith"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label">Email <span className="text-red-500">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="jane.smith@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input"
                placeholder="415-555-0100"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="source" className="label">Source</label>
              <select id="source" name="source" className="input" value={form.source} onChange={handleChange}>
                <option value="">Select source...</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Indeed">Indeed</option>
                <option value="AngelList">AngelList</option>
                <option value="Greenhouse">Greenhouse</option>
                <option value="Job Board">Job Board</option>
                <option value="Direct">Direct</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="linkedInUrl" className="label">LinkedIn URL</label>
            <input
              id="linkedInUrl"
              name="linkedInUrl"
              type="url"
              className="input"
              placeholder="https://linkedin.com/in/..."
              value={form.linkedInUrl}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="notes" className="label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="input h-auto"
              placeholder="Any notes about this candidate..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Adding...' : 'Add Candidate'}
            </button>
            <Link href={jobId ? `/jobs/${jobId}` : '/candidates'} className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
