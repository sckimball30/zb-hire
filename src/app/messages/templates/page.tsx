'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { toast } from 'sonner'

type Template = { id: string; name: string; subject: string; body: string; category: string }

const CATEGORIES = ['Outreach', 'Interviews', 'Offers', 'Rejections', 'General']

const CATEGORY_COLORS: Record<string, string> = {
  Outreach:   'bg-blue-100 text-blue-700',
  Interviews: 'bg-purple-100 text-purple-700',
  Offers:     'bg-green-100 text-green-700',
  Rejections: 'bg-red-100 text-red-700',
  General:    'bg-gray-100 text-gray-600',
}

const EMPTY: Omit<Template, 'id'> = { name: '', subject: '', body: '', category: 'General' }

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; template?: Template } | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Template | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/messages/templates')
    const data: Template[] = await res.json()
    setTemplates(data)
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...EMPTY, category: activeCategory ?? 'General' })
    setModal({ mode: 'create' })
  }

  function openEdit(t: Template) {
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category })
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

  async function seedDefaults() {
    if (!confirm('This will add or update all default Wigglitz templates. Continue?')) return
    setSeeding(true)
    const res = await fetch('/api/admin/seed-templates', { method: 'POST' })
    setSeeding(false)
    if (res.ok) { toast.success('Default templates loaded!'); await load() }
    else toast.error('Failed to load templates.')
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return
    const res = await fetch(`/api/messages/templates/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Template deleted.'); setTemplates(prev => prev.filter(t => t.id !== id)) }
    else toast.error('Failed to delete template.')
  }

  // Group by category, respecting the defined order
  const categoriesInUse = CATEGORIES.filter(c => templates.some(t => t.category === c))
  // Add any unexpected categories at the end
  const extraCategories = [...new Set(templates.map(t => t.category))].filter(c => !CATEGORIES.includes(c))
  const allCategories = [...categoriesInUse, ...extraCategories]

  const visibleTemplates = activeCategory
    ? templates.filter(t => t.category === activeCategory)
    : templates

  // Group for display
  const grouped: Record<string, Template[]> = {}
  for (const t of visibleTemplates) {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category].push(t)
  }
  const groupKeys = (activeCategory ? [activeCategory] : allCategories).filter(c => grouped[c]?.length)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Reusable email templates for candidate outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedDefaults} disabled={seeding} className="btn-outline flex items-center gap-2 text-sm">
            {seeding ? 'Loading…' : '↓ Load Default Templates'}
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      {!loading && templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({templates.length})
          </button>
          {allCategories.map(cat => {
            const count = templates.filter(t => t.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white'
                    : `${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'} hover:opacity-80`
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1">Create templates for interview invites, rejections, offers, etc.</p>
          <button onClick={openCreate} className="btn-primary mt-4 mx-auto">Create your first template</button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupKeys.map(cat => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}>
                  {cat}
                </span>
                <span className="text-xs text-gray-400">{grouped[cat].length} template{grouped[cat].length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {grouped[cat].map(t => (
                  <div key={t.id} className="card p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreview(t)}>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">Subject: {t.subject}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{t.body}</p>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="input w-full"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email subject</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Interview Invitation – {{Job Title}}"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  className="input w-full resize-none text-sm"
                  rows={8}
                  placeholder="Hi {{First Name}},&#10;&#10;We'd like to invite you for an interview…"
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">{preview.name}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[preview.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {preview.category}
                </span>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
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
