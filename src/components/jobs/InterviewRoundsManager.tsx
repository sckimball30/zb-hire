'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Save } from 'lucide-react'

type RoundInterviewerItem = {
  interviewerId: string
  interviewer: { id: string; name: string; title: string | null }
}

type Round = {
  id: string
  name: string
  roundNumber: number
  duration: number
  interviewers: RoundInterviewerItem[]
}

type InterviewerOption = {
  id: string
  name: string
  title: string | null
}

interface InterviewRoundsManagerProps {
  jobId: string
  initialRounds: Round[]
  allInterviewers: InterviewerOption[]
}

type LocalRound = {
  id: string | null // null = unsaved new row
  name: string
  roundNumber: number
  duration: number
  interviewerIds: string[]
  saving: boolean
  deleting: boolean
}

export function InterviewRoundsManager({ jobId, initialRounds, allInterviewers }: InterviewRoundsManagerProps) {
  const router = useRouter()

  const [rounds, setRounds] = useState<LocalRound[]>(
    initialRounds.map(r => ({
      id: r.id,
      name: r.name,
      roundNumber: r.roundNumber,
      duration: r.duration,
      interviewerIds: r.interviewers.map(ri => ri.interviewerId),
      saving: false,
      deleting: false,
    }))
  )

  function addRound() {
    const nextNumber = rounds.length + 1
    setRounds(prev => [
      ...prev,
      {
        id: null,
        name: `Round ${nextNumber}`,
        roundNumber: nextNumber,
        duration: 60,
        interviewerIds: [],
        saving: false,
        deleting: false,
      },
    ])
  }

  function updateField(index: number, field: keyof Omit<LocalRound, 'id' | 'saving' | 'deleting' | 'interviewerIds'>, value: string | number) {
    setRounds(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  function toggleInterviewer(index: number, interviewerId: string) {
    setRounds(prev => prev.map((r, i) => {
      if (i !== index) return r
      const has = r.interviewerIds.includes(interviewerId)
      return {
        ...r,
        interviewerIds: has
          ? r.interviewerIds.filter(id => id !== interviewerId)
          : [...r.interviewerIds, interviewerId],
      }
    }))
  }

  async function saveRound(index: number) {
    const round = rounds[index]
    setRounds(prev => prev.map((r, i) => i === index ? { ...r, saving: true } : r))

    try {
      let savedId = round.id

      if (!round.id) {
        // Create new round
        const res = await fetch(`/api/jobs/${jobId}/rounds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: round.name, roundNumber: round.roundNumber, duration: round.duration }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Failed to create round')
        }
        const created = await res.json()
        savedId = created.id
      } else {
        // Update existing round
        const res = await fetch(`/api/jobs/${jobId}/rounds/${round.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: round.name, duration: round.duration }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Failed to update round')
        }
      }

      // Sync interviewers: fetch current state, then diff
      const currentRes = await fetch(`/api/jobs/${jobId}/rounds`)
      const currentRounds: Round[] = await currentRes.json()
      const existing = currentRounds.find(r => r.id === savedId)
      const existingIds = existing ? existing.interviewers.map(ri => ri.interviewerId) : []
      const desired = round.interviewerIds

      const toAdd = desired.filter(id => !existingIds.includes(id))
      const toRemove = existingIds.filter(id => !desired.includes(id))

      await Promise.all([
        ...toAdd.map(interviewerId =>
          fetch(`/api/jobs/${jobId}/rounds/${savedId}/interviewers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewerId }),
          })
        ),
        ...toRemove.map(interviewerId =>
          fetch(`/api/jobs/${jobId}/rounds/${savedId}/interviewers`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewerId }),
          })
        ),
      ])

      setRounds(prev => prev.map((r, i) => i === index ? { ...r, id: savedId, saving: false } : r))
      toast.success('Round saved.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save round')
      setRounds(prev => prev.map((r, i) => i === index ? { ...r, saving: false } : r))
    }
  }

  async function deleteRound(index: number) {
    const round = rounds[index]

    if (!round.id) {
      // Not persisted yet, just remove from local state
      setRounds(prev => prev.filter((_, i) => i !== index))
      return
    }

    setRounds(prev => prev.map((r, i) => i === index ? { ...r, deleting: true } : r))

    try {
      const res = await fetch(`/api/jobs/${jobId}/rounds/${round.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to delete round')
      }
      setRounds(prev => prev.filter((_, i) => i !== index))
      toast.success('Round deleted.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete round')
      setRounds(prev => prev.map((r, i) => i === index ? { ...r, deleting: false } : r))
    }
  }

  const durationOptions = [15, 30, 45, 60, 90, 120]

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Interview Rounds</h2>
          <p className="text-xs text-gray-500 mt-0.5">Define rounds and assign interviewers to each</p>
        </div>
        <button onClick={addRound} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Round
        </button>
      </div>

      {rounds.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-500 text-sm">
          No interview rounds defined yet. Click &quot;Add Round&quot; to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-12">Round</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Interviewers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-32">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rounds.map((round, index) => (
                <tr key={round.id ?? `new-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={round.name}
                      onChange={e => updateField(index, 'name', e.target.value)}
                      className="input text-sm py-1.5 w-full min-w-[140px]"
                      placeholder="e.g. Phone Screen"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                      {allInterviewers.map(iv => {
                        const selected = round.interviewerIds.includes(iv.id)
                        return (
                          <button
                            key={iv.id}
                            onClick={() => toggleInterviewer(index, iv.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-[#111] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {iv.name}
                          </button>
                        )
                      })}
                      {allInterviewers.length === 0 && (
                        <span className="text-xs text-gray-400">No interviewers available</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={round.duration}
                      onChange={e => updateField(index, 'duration', Number(e.target.value))}
                      className="input text-sm py-1.5 w-full"
                    >
                      {durationOptions.map(d => (
                        <option key={d} value={d}>{d} min</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveRound(index)}
                        disabled={round.saving}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111] text-white text-xs font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        {round.saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => deleteRound(index)}
                        disabled={round.deleting}
                        className="flex items-center p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
