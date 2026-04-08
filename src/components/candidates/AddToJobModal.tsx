'use client'

import { useState, useEffect } from 'react'
import { X, Briefcase, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  title: string
  department: string | null
  status: string
}

interface Props {
  candidateId: string
  candidateName: string
  existingJobIds: string[]   // jobs this candidate is already in
  onClose: () => void
}

export function AddToJobModal({ candidateId, candidateName, existingJobIds, onClose }: Props) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then((data: Job[]) => {
        // Show open jobs that the candidate isn't already in
        const available = data.filter(j => j.status === 'OPEN' && !existingJobIds.includes(j.id))
        setJobs(available)
      })
  }, [existingJobIds])

  async function handleAdd() {
    if (!selectedJobId) return
    setLoading(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId: selectedJobId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add to job')
      }
      const app = await res.json()
      toast.success(`${candidateName} added to pipeline!`)
      onClose()
      router.push(`/applications/${app.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add to Job</h2>
              <p className="text-xs text-gray-400 mt-0.5">{candidateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {candidateName} is already in all open jobs, or there are no open jobs at this time.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select a role</label>
                <select
                  className="input w-full"
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                >
                  <option value="">Choose a job…</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title}{j.department ? ` — ${j.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400">
                They'll be added to the pipeline at the <strong>Applied</strong> stage.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          {jobs.length > 0 && (
            <button
              onClick={handleAdd}
              disabled={loading || !selectedJobId}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add to Pipeline'}
            </button>
          )}
          <button onClick={onClose} className="btn-outline">
            {jobs.length === 0 ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
