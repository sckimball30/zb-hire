'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Linkedin, Phone, Mail, Users, MessageCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export type InteractionType = 'LINKEDIN' | 'PHONE' | 'EMAIL' | 'MEETING' | 'OTHER'

const INTERACTION_TYPES: { value: InteractionType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'LINKEDIN', label: 'LinkedIn',   icon: Linkedin,       color: 'text-blue-600 bg-blue-50' },
  { value: 'PHONE',    label: 'Phone',      icon: Phone,          color: 'text-green-600 bg-green-50' },
  { value: 'EMAIL',    label: 'Email',      icon: Mail,           color: 'text-purple-600 bg-purple-50' },
  { value: 'MEETING',  label: 'Meeting',    icon: Users,          color: 'text-orange-600 bg-orange-50' },
  { value: 'OTHER',    label: 'Other',      icon: MessageCircle,  color: 'text-gray-600 bg-gray-100' },
]

function typeConfig(type: string) {
  return INTERACTION_TYPES.find(t => t.value === type) ?? INTERACTION_TYPES[4]
}

type Interaction = {
  id: string
  content: string
  type: string
  authorName: string | null
  createdAt: string
}

export function InteractionsLog({
  candidateId,
  initialInteractions,
}: {
  candidateId: string
  initialInteractions: Interaction[]
}) {
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<InteractionType>('LINKEDIN')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), type: selectedType }),
      })
      if (!res.ok) throw new Error('Failed to log interaction')
      const saved = await res.json()
      setInteractions(prev => [saved, ...prev])
      setContent('')
      setFormOpen(false)
      toast.success('Interaction logged')
    } catch {
      toast.error('Failed to log interaction')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/candidates/${candidateId}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: id }),
    })
    if (res.ok) {
      setInteractions(prev => prev.filter(i => i.id !== id))
    } else {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Interactions {interactions.length > 0 && <span className="text-gray-400 font-normal">({interactions.length})</span>}
        </h3>
        <button
          onClick={() => setFormOpen(o => !o)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          {formOpen ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Cancel</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Log</>
          )}
        </button>
      </div>

      {/* Inline form */}
      {formOpen && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-3">
          {/* Channel picker */}
          <div className="flex flex-wrap gap-1.5">
            {INTERACTION_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedType === t.value
                    ? `${t.color} border-transparent`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              selectedType === 'LINKEDIN' ? 'e.g. Reached out via LinkedIn, waiting on response…' :
              selectedType === 'PHONE'    ? 'e.g. Called re: interview — no answer, left voicemail…' :
              selectedType === 'EMAIL'    ? 'e.g. Sent follow-up outside the system…' :
              selectedType === 'MEETING'  ? 'e.g. Coffee chat — very interested, liked the culture…' :
                                           'e.g. Appointment fell through, rescheduling…'
            }
            rows={3}
            className="input w-full resize-none text-sm"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">⌘+Enter to save</span>
            <button
              onClick={handleSubmit}
              disabled={saving || !content.trim()}
              className="btn-primary text-xs"
            >
              {saving ? 'Saving…' : 'Log Interaction'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {interactions.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-gray-400">
          No interactions logged yet.<br />
          <button onClick={() => setFormOpen(true)} className="text-blue-500 hover:underline mt-1">
            Log one now
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {interactions.map(interaction => {
            const cfg = typeConfig(interaction.type)
            const Icon = cfg.icon
            return (
              <li key={interaction.id} className="px-4 py-3 group flex items-start gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{interaction.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-medium">{cfg.label}</span>
                    {interaction.authorName && <> · {interaction.authorName}</>}
                    {' · '}{timeAgo(new Date(interaction.createdAt))}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(interaction.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
