'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit2, Check, X } from 'lucide-react'

interface ScorecardMetaProps {
  jobId: string
  initialReportsTo: string | null
  initialMission: string | null
}

export function ScorecardMeta({ jobId, initialReportsTo, initialMission }: ScorecardMetaProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [reportsTo, setReportsTo] = useState(initialReportsTo || '')
  const [mission, setMission] = useState(initialMission || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/scorecard-meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportsTo: reportsTo || null, mission: mission || null }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Saved')
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setReportsTo(initialReportsTo || '')
    setMission(initialMission || '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Scorecard Context</h3>
          <button
            onClick={() => setEditing(true)}
            className="btn-outline text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 font-medium">Reports To</p>
            <p className="text-sm text-gray-900 mt-0.5">
              {initialReportsTo || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Mission</p>
            <p className="text-sm text-gray-900 mt-0.5 leading-relaxed">
              {initialMission || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Scorecard Context</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="btn-outline text-xs flex items-center gap-1.5"
            disabled={saving}
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Reports To</label>
          <input
            className="input text-sm"
            placeholder="e.g. VP of Engineering"
            value={reportsTo}
            onChange={e => setReportsTo(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Mission</label>
          <textarea
            className="input h-auto text-sm"
            rows={3}
            placeholder="The mission of this role..."
            value={mission}
            onChange={e => setMission(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
