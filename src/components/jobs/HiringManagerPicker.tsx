'use client'

import { useState } from 'react'
import { UserCog, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string | null
  email: string | null
}

interface Props {
  jobId: string
  allUsers: User[]
  currentHiringManagerId: string | null
}

export function HiringManagerPicker({ jobId, allUsers, currentHiringManagerId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentHiringManagerId ?? '')
  const [saving, setSaving] = useState(false)

  async function handleChange(userId: string) {
    setSelected(userId)
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/hiring-manager`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || null }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(userId ? 'Hiring manager assigned' : 'Hiring manager removed')
      router.refresh()
    } catch {
      toast.error('Could not update hiring manager')
    } finally {
      setSaving(false)
    }
  }

  const current = allUsers.find(u => u.id === selected)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <UserCog className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Hiring Manager</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Sees all hire/no-hire decisions and gut checks alongside the recruiter
          </p>
        </div>
      </div>

      <div className="px-6 py-4">
        {current ? (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                {(current.name ?? current.email ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{current.name ?? current.email}</p>
                {current.name && <p className="text-xs text-gray-400">{current.email}</p>}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 rounded-full px-2.5 py-1 font-medium">
              <Check className="w-3 h-3" /> Hiring Manager
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-3">No hiring manager assigned yet.</p>
        )}

        <select
          className="input w-full text-sm"
          value={selected}
          onChange={e => handleChange(e.target.value)}
          disabled={saving}
        >
          <option value="">— No hiring manager —</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
