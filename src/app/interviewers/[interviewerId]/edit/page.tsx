'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditInterviewerPage({ params }: { params: { interviewerId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', title: '', calendlyUrl: '' })

  useEffect(() => {
    fetch(`/api/interviewers/${params.interviewerId}`)
      .then(r => r.json())
      .then(data => setForm({
        name: data.name ?? '',
        email: data.email ?? '',
        title: data.title ?? '',
        calendlyUrl: data.calendlyUrl ?? '',
      }))
  }, [params.interviewerId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/interviewers/${params.interviewerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          title: form.title || null,
          calendlyUrl: form.calendlyUrl || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      toast.success('Interviewer updated')
      router.push('/interviewers')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this interviewer? This cannot be undone.')) return
    setDeleting(true)
    try {
      await fetch(`/api/interviewers/${params.interviewerId}`, { method: 'DELETE' })
      toast.success('Interviewer deleted')
      router.push('/interviewers')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/interviewers" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Interviewers
        </Link>
        <h1 className="page-title">Edit Interviewer</h1>
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
            <p className="text-xs text-gray-400 mt-1">Used to generate self-scheduling links for candidates</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href="/interviewers" className="btn-secondary">Cancel</Link>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
