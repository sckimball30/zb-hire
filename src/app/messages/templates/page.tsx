'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { toast } from 'sonner'

type Template = { id: string; name: string; subject: string; body: string }

const EMPTY: Omit<Template, 'id'> = { name: '', subject: '', body: '' }

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; template?: Template } | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Template | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/messages/templates')
    setTemplates(await res.json())
    setLoading(false)
  }

  function openCreate() {
    setForm(EMPTY)
    setModal({ mode: 'create' })
  }

  function openEdit(t: Template) {
    setForm({ name: t.name, subject: t.subject, body: t.body })
    setModal({ mode: 'edit', template: t })
  }

  async function save() {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('All fields are required.')
      return
    }
    setSaving(true)
    if (modal?.mode === 'create') {
      const res = await fetch('/api/messages/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('Template created.'); await load(); setModal(null) }
      else toast.error('Failed to create template.')
    } else if (modal?.mode === 'edit' && modal.template) {
      const res = await fetch(`/api/messages/templates/${modal.template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('Template saved.'); await load(); setModal(null) }
      else toast.error('Failed to save template.')
    }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return
    const res = await fetch(`/api/messages/templates/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Template deleted.'); setTemplates(prev => prev.filter(t => t.id !== id)) }
    else toast.error('Failed to delete template.')
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Reusable email templates for candidate outreach</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1">Create templates for interview invites, rejections, offers, etc.</p>
          <button onClick={openCreate} className="btn-primary mt-4 mx-auto">Create your first template</button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="card p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreview(t)}>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500 mt-0.5 truncate">Subject: {t.subject}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.body}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="btn-outline p-2">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(t.id)} className="btn-outline p-2 text-red-500 hover:border-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {modal.mode === 'create' ? 'New Template' : 'Edit Template'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template name</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Interview Invite"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email subject</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Interview Invitation – {{role}}"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  className="input w-full resize-none text-sm"
                  rows={7}
                  placeholder="Hi {{firstName}},&#10;&#10;We'd like to invite you for an interview…"
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{preview.name}</h2>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</p>
                <p className="text-sm text-gray-800 mt-1">{preview.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Body</p>
                <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans leading-relaxed">{preview.body}</pre>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setPreview(null)} className="btn-outline">Close</button>
              <button onClick={() => { setPreview(null); openEdit(preview) }} className="btn-primary flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
