'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, BellOff, Star, Trash2, UserPlus } from 'lucide-react'
import { initials } from '@/lib/utils'

type RecruiterUser = { id: string; name: string | null; email: string | null }
type RecruiterAssignment = {
  id: string
  userId: string
  isMain: boolean
  emailNotifications: boolean
  user: RecruiterUser
}

interface RecruiterManagerProps {
  jobId: string
  currentRecruiters: RecruiterAssignment[]
  allRecruiters: RecruiterUser[]
}

export function RecruiterManager({ jobId, currentRecruiters, allRecruiters }: RecruiterManagerProps) {
  const router = useRouter()
  const [recruiters, setRecruiters] = useState(currentRecruiters)
  const [availableRecruiters, setAvailableRecruiters] = useState(
    allRecruiters.filter(u => !currentRecruiters.some(r => r.userId === u.id))
  )
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('')
  const [adding, setAdding] = useState(false)

  async function addRecruiter(isMain: boolean) {
    if (!selectedRecruiterId) return
    setAdding(true)
    const res = await fetch(`/api/jobs/${jobId}/recruiters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedRecruiterId, isMain }),
    })
    setAdding(false)
    if (res.ok) {
      const newAssignment = await res.json()
      setRecruiters(prev => {
        const updated = isMain ? prev.map(r => ({ ...r, isMain: false })) : prev
        return [...updated, newAssignment]
      })
      setAvailableRecruiters(prev => prev.filter(u => u.id !== selectedRecruiterId))
      setSelectedRecruiterId('')
      toast.success(`Recruiter added as ${isMain ? 'Main' : 'Support'}.`)
      router.refresh()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to add recruiter.')
    }
  }

  async function removeRecruiter(userId: string) {
    const res = await fetch(`/api/jobs/${jobId}/recruiters`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      const removed = recruiters.find(r => r.userId === userId)
      setRecruiters(prev => prev.filter(r => r.userId !== userId))
      if (removed) setAvailableRecruiters(prev => [...prev, removed.user].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
      toast.success('Recruiter removed.')
      router.refresh()
    } else {
      toast.error('Failed to remove recruiter.')
    }
  }

  async function toggleMain(userId: string, currentIsMain: boolean) {
    const res = await fetch(`/api/jobs/${jobId}/recruiters`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isMain: !currentIsMain }),
    })
    if (res.ok) {
      setRecruiters(prev => prev.map(r => ({
        ...r,
        isMain: r.userId === userId ? !currentIsMain : (!currentIsMain ? false : r.isMain),
      })))
      toast.success(!currentIsMain ? 'Set as Main Recruiter.' : 'Changed to Support Recruiter.')
      router.refresh()
    } else {
      toast.error('Failed to update.')
    }
  }

  async function toggleEmailNotifications(userId: string, current: boolean) {
    const res = await fetch(`/api/jobs/${jobId}/recruiters`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emailNotifications: !current }),
    })
    if (res.ok) {
      setRecruiters(prev => prev.map(r => r.userId === userId ? { ...r, emailNotifications: !current } : r))
      toast.success(!current ? 'Email alerts turned on.' : 'Email alerts turned off.')
    } else {
      toast.error('Failed to update.')
    }
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Recruiters ({recruiters.length})</h3>
        <p className="text-xs text-gray-500 mt-0.5">★ = Main Recruiter · First added is set as main automatically</p>
      </div>

      {recruiters.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500 text-sm">
          No recruiters assigned yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recruiters.map(r => (
            <li key={r.id} className="flex items-center justify-between px-6 py-3 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4AFFD2]/20 text-[#111] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials((r.user.name ?? r.user.email ?? '?').split(' ')[0], (r.user.name ?? '').split(' ').slice(-1)[0])}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.user.name ?? r.user.email}</p>
                  <p className="text-xs text-gray-400">{r.isMain ? 'Main Recruiter' : 'Support'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMain(r.userId, r.isMain)}
                  title={r.isMain ? 'Demote to Support' : 'Set as Main'}
                  className={`p-1.5 rounded transition-colors ${r.isMain ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                >
                  <Star className="w-4 h-4" fill={r.isMain ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => toggleEmailNotifications(r.userId, r.emailNotifications)}
                  title={r.emailNotifications ? 'Turn off email alerts' : 'Turn on email alerts'}
                  className={`p-1.5 rounded transition-colors ${r.emailNotifications ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
                >
                  {r.emailNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => removeRecruiter(r.userId)}
                  className="p-1.5 rounded text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {availableRecruiters.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Recruiter</p>
          <div className="flex items-center gap-2">
            <select
              value={selectedRecruiterId}
              onChange={e => setSelectedRecruiterId(e.target.value)}
              className="input text-sm py-1.5 w-48"
            >
              <option value="">Select recruiter…</option>
              {availableRecruiters.map(u => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
            <button
              onClick={() => addRecruiter(recruiters.length === 0)}
              disabled={!selectedRecruiterId || adding}
              className="btn-primary text-xs py-1.5 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {adding ? 'Adding…' : recruiters.length === 0 ? 'Add as Main' : 'Add as Support'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
