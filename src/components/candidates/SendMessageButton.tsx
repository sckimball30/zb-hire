'use client'

import { useState, useEffect } from 'react'
import { Send, X } from 'lucide-react'
import { toast } from 'sonner'

type Template = { id: string; name: string; subject: string; body: string }

export function SendMessageButton({ candidateId, candidateEmail }: { candidateId: string; candidateEmail: string }) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/messages/templates').then(r => r.json()).then(setTemplates)
    }
  }, [open])

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id)
    if (t) { setSubject(t.subject); setBody(t.body) }
    setSelectedTemplate(id)
  }

  async function send() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, subject, body, templateId: selectedTemplate || undefined }),
    })
    setSending(false)
    if (res.ok) {
      toast.success('Message sent!')
      setOpen(false)
      setSubject(''); setBody(''); setSelectedTemplate('')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to send message.')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline text-xs flex items-center gap-1.5">
        <Send className="w-3.5 h-3.5" />
        Send Message
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Send Message to {candidateEmail}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use template</label>
                  <select
                    value={selectedTemplate}
                    onChange={e => applyTemplate(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">— Choose a template —</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="input w-full"
                  placeholder="Subject line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={6}
                  className="input w-full resize-none text-sm"
                  placeholder="Write your message…"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
              <button
                onClick={send}
                disabled={sending || !subject.trim() || !body.trim()}
                className="btn-primary flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
