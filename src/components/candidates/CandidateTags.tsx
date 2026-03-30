'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
}

interface Props {
  candidateId: string
  initialTags: Tag[]
}

const COLOR_SWATCHES = ['#6b7280', '#4AFFD2', '#3AADE0', '#a78bfa', '#f87171', '#fb923c', '#fbbf24', '#34d399']

export function CandidateTags({ candidateId, initialTags }: Props) {
  const [assignedTags, setAssignedTags] = useState<Tag[]>(initialTags)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6b7280')
  const [creating, setCreating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      fetch('/api/tags').then(r => r.json()).then(setAllTags)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const assignedIds = new Set(assignedTags.map(t => t.id))
  const available = allTags.filter(t => !assignedIds.has(t.id))

  async function addTag(tag: Tag) {
    await fetch(`/api/candidates/${candidateId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tag.id }),
    })
    setAssignedTags(prev => [...prev, tag])
    setOpen(false)
  }

  async function removeTag(tagId: string) {
    await fetch(`/api/candidates/${candidateId}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    })
    setAssignedTags(prev => prev.filter(t => t.id !== tagId))
  }

  async function createTag() {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })
    const tag = await res.json()
    setCreating(false)
    setNewName('')
    await addTag(tag)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assignedTags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border"
          style={{ backgroundColor: tag.color + '20', borderColor: tag.color + '60', color: tag.color }}
        >
          {tag.name}
          <button
            onClick={() => removeTag(tag.id)}
            className="hover:opacity-70 transition-opacity ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add tag
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {/* Available tags */}
            {available.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                {available.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => addTag(tag)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left hover:bg-gray-50 text-sm text-gray-700"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}

            {/* Create new tag */}
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1.5">New tag</p>
              <div className="flex gap-1.5 mb-1.5">
                {COLOR_SWATCHES.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createTag()}
                  placeholder="Tag name…"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4AFFD2]"
                />
                <button
                  onClick={createTag}
                  disabled={!newName.trim() || creating}
                  className="px-2 py-1 text-xs bg-[#111] text-white rounded-lg disabled:opacity-40"
                >
                  {creating ? '…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
