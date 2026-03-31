'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'

interface Outcome {
  id?: string
  priority: number
  outcome: string
  kpi?: string | null
}

interface OutcomesEditorProps {
  jobId: string
  initialOutcomes: Outcome[]
}

export function OutcomesEditor({ jobId, initialOutcomes }: OutcomesEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<{ outcome: string; kpi: string }[]>(
    initialOutcomes.length > 0
      ? initialOutcomes.map(o => ({ outcome: o.outcome, kpi: o.kpi || '' }))
      : [{ outcome: '', kpi: '' }]
  )
  const [saving, setSaving] = useState(false)

  const addRow = () => setRows(r => [...r, { outcome: '', kpi: '' }])
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'outcome' | 'kpi', val: string) => {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomes: rows }),
      })
      if (!res.ok) throw new Error('Failed to save outcomes')
      toast.success('Outcomes saved')
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setRows(
      initialOutcomes.length > 0
        ? initialOutcomes.map(o => ({ outcome: o.outcome, kpi: o.kpi || '' }))
        : [{ outcome: '', kpi: '' }]
    )
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Outcomes</h3>
          <button
            onClick={() => setEditing(true)}
            className="btn-outline text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3 h-3" />
            Edit Outcomes
          </button>
        </div>
        {initialOutcomes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No outcomes defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 w-8">#</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2">Outcome</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2">KPI / Measure</th>
              </tr>
            </thead>
            <tbody>
              {initialOutcomes.map((o) => (
                <tr key={o.priority} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-3 text-gray-400 font-mono text-xs">{o.priority}</td>
                  <td className="py-2 pr-4 text-gray-900">{o.outcome}</td>
                  <td className="py-2 text-gray-500">{o.kpi || <span className="text-gray-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Edit Outcomes</h3>
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
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-xs text-gray-400 font-mono mt-2.5 w-5 text-right flex-shrink-0">{i + 1}</span>
            <input
              className="input flex-1 text-sm"
              placeholder="Outcome description..."
              value={row.outcome}
              onChange={e => updateRow(i, 'outcome', e.target.value)}
            />
            <input
              className="input w-48 text-sm"
              placeholder="KPI / measure (optional)"
              value={row.kpi}
              onChange={e => updateRow(i, 'kpi', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="mt-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
              disabled={rows.length === 1}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <Plus className="w-3 h-3" />
        Add outcome
      </button>
    </div>
  )
}
