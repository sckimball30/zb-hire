'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  title: string
  department: string | null
  status: string
}

interface Props {
  applicationId: string
  currentJobId: string
  currentJobTitle: string
  candidateName: string
  onClose: () => void
}

export function TransferJobModal({
  applicationId,
  currentJobId,
  currentJobTitle,
  candidateName,
  onClose,
}: Props) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [closeOriginal, setCloseOriginal] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then((data: Job[]) => {
        // Exclude the current job; show all non-draft jobs as potential targets
        setJobs(data.filter((j: Job) => j.id !== currentJobId && j.status !== 'DRAFT'))
      })
  }, [currentJobId])

  async function handleTransfer() {
    if (!selectedJobId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetJobId: selectedJobId, closeOriginal }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Transfer failed')
      }
      const data = await res.json()
      const targetJob = jobs.find(j => j.id === selectedJobId)
      toast.success(`${candidateName} moved to ${targetJob?.title ?? 'new role'}!`)
      onClose()
      router.push(`/applications/${data.applicationId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed')
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
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Move to Another Role</h2>
              <p className="text-xs text-gray-400 mt-0.5">{candidateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Current role */}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-400">From:</span>
            <span className="font-medium text-gray-700">{currentJobTitle}</span>
          </div>

          {/* Target role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 text-center">
                No other active roles available.
              </p>
            ) : (
              <select
                className="input w-full"
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
              >
                <option value="">Choose a role…</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title}{j.department ? ` — ${j.department}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Close original toggle */}
          {jobs.length > 0 && (
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => setCloseOriginal(v => !v)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${closeOriginal ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}`}
                >
                  {closeOriginal && <span className="text-white text-xs font-bold leading-none">✓</span>}
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Close current application</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mark the <strong>{currentJobTitle}</strong> application as Rejected so it doesn't stay in both pipelines
                </p>
              </div>
            </label>
          )}

          <p className="text-xs text-gray-400">
            Their current stage and profile details will carry over to the new role.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          {jobs.length > 0 && (
            <button
              onClick={handleTransfer}
              disabled={loading || !selectedJobId}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {loading ? 'Moving…' : 'Move to Role'}
            </button>
          )}
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
