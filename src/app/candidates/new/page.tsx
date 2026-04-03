'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

function NewCandidateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const [loading, setLoading] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', linkedInUrl: '', source: '', notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) setResumeFile(file)
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
          firstName: form.firstName, lastName: form.lastName, email: form.email,
          phone: form.phone || undefined, linkedInUrl: form.linkedInUrl || undefined,
          source: form.source || undefined, notes: form.notes || undefined,
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to create candidate') }
      const candidate = await res.json()

      // Upload resume if provided
      if (resumeFile) {
        try {
          const fd = new FormData()
          fd.append('resume', resumeFile)
          await fetch(`/api/candidates/${candidate.id}/resume`, { method: 'POST', body: fd })
        } catch {
          toast.error('Candidate created but resume upload failed — you can upload from their profile')
        }
      }

      if (jobId) {
        const appRes = await fetch('/api/applications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, jobId }),
        })
        if (appRes.ok) { const app = await appRes.json(); toast.success('Candidate added to pipeline'); router.push(`/applications/${app.id}`); return }
      }
      toast.success('Candidate created successfully')
      router.push(`/candidates/${candidate.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create candidate')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={jobId ? `/jobs/${jobId}` : '/candidates'} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />{jobId ? 'Back to Pipeline' : 'Back to Candidates'}
        </Link>
        <h1 className="page-title">Add Candidate</h1>
      </div>
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">First Name <span className="text-red-500">*</span></label>
              <input id="firstName" name="firstName" type="text" className="input" placeholder="Jane" value={form.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name <span className="text-red-500">*</span></label>
              <input id="lastName" name="lastName" type="text" className="input" placeholder="Smith" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="label">Email <span className="text-red-500">*</span></label>
            <input id="email" name="email" type="email" className="input" placeholder="jane.smith@email.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" name="phone" type="tel" className="input" placeholder="415-555-0100" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="source" className="label">Source</label>
              <select id="source" name="source" className="input" value={form.source} onChange={handleChange}>
                <option value="">Select source...</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Indeed">Indeed</option>
                <option value="Job Board">Job Board</option>
                <option value="Direct">Direct</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="linkedInUrl" className="label">LinkedIn URL</label>
            <input id="linkedInUrl" name="linkedInUrl" type="url" className="input" placeholder="https://linkedin.com/in/..." value={form.linkedInUrl} onChange={handleChange} />
          </div>
          {/* Resume upload */}
          <div>
            <label className="label">Resume <span className="text-gray-400 font-normal">(optional)</span></label>
            {resumeFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{resumeFile.name}</span>
                <span className="text-xs text-gray-400">{(resumeFile.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  onClick={() => { setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-300" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Drop resume here or click to upload</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF or Word document</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setResumeFile(f) }}
            />
          </div>

          <div>
            <label htmlFor="notes" className="label">Notes</label>
            <textarea id="notes" name="notes" rows={3} className="input h-auto" placeholder="Any notes about this candidate..." value={form.notes} onChange={handleChange} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Adding...' : 'Add Candidate'}</button>
            <Link href={jobId ? `/jobs/${jobId}` : '/candidates'} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewCandidatePage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>}>
      <NewCandidateForm />
    </Suspense>
  )
}
