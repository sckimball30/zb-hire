'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function NewInterviewerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    calendlyUrl: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/interviewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          title: form.title || undefined,
          calendlyUrl: form.calendlyUrl || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create interviewer')
      }

      toast.success('Interviewer added')
      router.push('/interviewers')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create interviewer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/interviewers" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Interviewers
        </Link>
        <h1 className="page-title">Add Interviewer</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Full Name <span className="text-red-500">*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="label">Email <span className="text-red-500">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="jane@company.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              className="input"
              placeholder="e.g. Senior Engineer"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="calendlyUrl" className="label">Calendly Link</label>
            <input
              id="calendlyUrl"
              name="calendlyUrl"
              type="url"
              className="input"
              placeholder="https://calendly.com/username/30min"
              value={form.calendlyUrl}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-400 mt-1">Used to send scheduling links to candidates</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Adding...' : 'Add Interviewer'}
            </button>
            <Link href="/interviewers" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
