'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { CATEGORY_LABELS } from '@/lib/constants'

const CATEGORIES = [
  'TECHNICAL', 'BEHAVIORAL', 'CULTURE_FIT', 'LEADERSHIP',
  'COMMUNICATION', 'PROBLEM_SOLVING', 'ROLE_SPECIFIC'
] as const

export default function NewQuestionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    text: '',
    guidance: '',
    category: 'BEHAVIORAL' as string,
    tags: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) {
      toast.error('Question text is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: form.text,
          guidance: form.guidance || undefined,
          category: form.category,
          tags: form.tags || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create question')
      }

      toast.success('Question created')
      router.push('/questions')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/questions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Link>
        <h1 className="page-title">New Question</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="text" className="label">Question Text <span className="text-red-500">*</span></label>
            <textarea
              id="text"
              name="text"
              rows={3}
              className="input h-auto"
              placeholder="e.g. Tell me about a time you faced a major technical challenge..."
              value={form.text}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="label">Category <span className="text-red-500">*</span></label>
            <select
              id="category"
              name="category"
              className="input"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="guidance" className="label">Interviewer Guidance</label>
            <textarea
              id="guidance"
              name="guidance"
              rows={2}
              className="input h-auto"
              placeholder="Notes to help the interviewer evaluate the response..."
              value={form.guidance}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="tags" className="label">Tags</label>
            <input
              id="tags"
              name="tags"
              type="text"
              className="input"
              placeholder="e.g. leadership,teamwork (comma separated)"
              value={form.tags}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Question'}
            </button>
            <Link href="/questions" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
