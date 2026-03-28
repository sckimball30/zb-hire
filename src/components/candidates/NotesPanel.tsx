'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

type Note = {
  id: string
  content: string
  authorName: string | null
  createdAt: string
}

export function NotesPanel({ candidateId, initialNotes }: { candidateId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote() {
    if (!text.trim()) return
    setSaving(true)
    const res = await fetch(`/api/candidates/${candidateId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    })
    setSaving(false)
    if (res.ok) {
      const note = await res.json()
      setNotes(prev => [note, ...prev])
      setText('')
    } else {
      toast.error('Failed to save note.')
    }
  }

  async function deleteNote(noteId: string) {
    const res = await fetch(`/api/candidates/${candidateId}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } else {
      toast.error('Failed to delete note.')
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Notes ({notes.length})</h2>
      </div>

      {/* Add note */}
      <div className="px-6 py-4 border-b border-gray-100">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a note about this candidate…"
          rows={3}
          className="input w-full resize-none text-sm"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">⌘+Enter to save</span>
          <button onClick={addNote} disabled={saving || !text.trim()} className="btn-primary text-xs">
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">No notes yet.</div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {notes.map(note => (
            <li key={note.id} className="px-6 py-4 group">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-700 flex-1 whitespace-pre-wrap">{note.content}</p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {note.authorName && <span>{note.authorName} · </span>}
                {timeAgo(new Date(note.createdAt))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
