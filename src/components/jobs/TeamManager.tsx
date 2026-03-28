'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, UserPlus } from 'lucide-react'
import { initials } from '@/lib/utils'
import type { Interviewer, JobInterviewer } from '@/types'

type JobInterviewerWithInterviewer = JobInterviewer & {
  interviewer: Interviewer
}

interface TeamManagerProps {
  jobId: string
  currentTeam: JobInterviewerWithInterviewer[]
  availableInterviewers: Interviewer[]
}

export function TeamManager({ jobId, currentTeam, availableInterviewers }: TeamManagerProps) {
  const router = useRouter()
  const [team, setTeam] = useState(currentTeam)
  const [available, setAvailable] = useState(availableInterviewers)
  const [selectedId, setSelectedId] = useState('')
  const [role, setRole] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) {
      toast.error('Please select an interviewer')
      return
    }

    setAdding(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerId: selectedId, role: role || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add interviewer')
      }

      const newMember = await res.json()
      const interviewer = available.find((i) => i.id === selectedId)!
      setTeam((prev) => [...prev, { ...newMember, interviewer }])
      setAvailable((prev) => prev.filter((i) => i.id !== selectedId))
      setSelectedId('')
      setRole('')
      toast.success('Interviewer added to team')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add interviewer')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (interviewerId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove interviewer')
      }

      const removed = team.find((m) => m.interviewerId === interviewerId)
      if (removed) {
        setTeam((prev) => prev.filter((m) => m.interviewerId !== interviewerId))
        setAvailable((prev) => [...prev, removed.interviewer].sort((a, b) => a.name.localeCompare(b.name)))
      }
      toast.success('Interviewer removed from team')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove interviewer')
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Team */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Current Team ({team.length})</h2>
        </div>
        {team.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No interviewers assigned yet. Add team members below.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {team.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {initials(member.interviewer.name.split(' ')[0], member.interviewer.name.split(' ').slice(-1)[0])}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.interviewer.name}</div>
                    <div className="text-sm text-gray-500">
                      {member.interviewer.title}
                      {member.role && <span className="ml-2 text-blue-600">· {member.role}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.interviewerId)}
                  className="btn-ghost text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                  title="Remove from team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Interviewer */}
      {available.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add Interviewer
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="label">Interviewer</label>
              <select
                className="input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Select an interviewer...</option>
                {available.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.title ? `(${i.title})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Role on this job (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Technical Interviewer, Hiring Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <button type="submit" disabled={adding} className="btn-primary">
              {adding ? 'Adding...' : 'Add to Team'}
            </button>
          </form>
        </div>
      )}

      {available.length === 0 && team.length > 0 && (
        <p className="text-sm text-gray-500 text-center">All interviewers have been added to this team.</p>
      )}
    </div>
  )
}
