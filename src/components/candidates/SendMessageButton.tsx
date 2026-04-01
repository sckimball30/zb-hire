'use client'

import { useState, useEffect } from 'react'
import { Send, X, Clock } from 'lucide-react'
import { toast } from 'sonner'

type Template = { id: string; name: string; subject: string; body: string }

interface Props {
  candidateId: string
  candidateEmail: string
  candidateFirstName?: string
  jobTitle?: string
  recruiterName?: string
}

function addBusinessDays(days: number): Date {
  let date = new Date()
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) added++ // skip Sun=0, Sat=6
  }
  return date
}

function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function SendMessageButton({
  candidateId,
  candidateEmail,
  candidateFirstName,
  jobTitle,
  recruiterName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'schedule'>('now')
  const [delayDays, setDelayDays] = useState(1)

  useEffect(() => {
    if (open) {
      fetch('/api/messages/templates').then(r => r.json()).then(setTemplates)
    }
  }, [open])

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id)
    if (t) {
      let newSubject = t.subject
      let newBody = t.body

      if (candidateFirstName) {
        newSubject = newSubject.replaceAll('{{firstName}}', candidateFirstName)
        newBody = newBody.replaceAll('{{firstName}}', candidateFirstName)
      }
      if (jobTitle) {
        newSubject = newSubject.replaceAll('{{jobTitle}}', jobTitle)
        newBody = newBody.replaceAll('{{jobTitle}}', jobTitle)
      }
      if (recruiterName) {
        newSubject = newSubject.replaceAll('{{recruiterName}}', recruiterName)
        newBody = newBody.replaceAll('{{recruiterName}}', recruiterName)
      }

      setSubject(newSubject)
      setBody(newBody)
    }
    setSelectedTemplate(id)
  }

  function hasUnfilledPlaceholders(text: string): boolean {
    return /\{\{[^}]+\}\}/.test(text)
  }

  async function send() {
    if (!subject.trim() || !body.trim()) return

    if (hasUnfilledPlaceholders(subject) || hasUnfilledPlaceholders(body)) {
      toast.warning('Message contains unfilled placeholders like {{jobTitle}}. Edit before sending.')
      return
    }

    setSending(true)

    if (deliveryMode === 'now') {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, subject, body, templateId: selectedTemplate || undefined }),
      })
      setSending(false)
      if (res.ok) {
        toast.success('Message sent!')
        closeAndReset()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Failed to send message.')
      }
    } else {
      const res = await fetch('/api/messages/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          subject,
          body,
          templateId: selectedTemplate || undefined,
          delayDays,
        }),
      })
      setSending(false)
      if (res.ok) {
        const data = await res.json()
        const deliveryDate = new Date(data.scheduledFor)
        toast.success(`Message scheduled for ${formatDeliveryDate(deliveryDate)}`)
        closeAndReset()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Failed to schedule message.')
      }
    }
  }

  function closeAndReset() {
    setOpen(false)
    setSubject('')
    setBody('')
    setSelectedTemplate('')
    setDeliveryMode('now')
    setDelayDays(1)
  }

  const scheduledDate = deliveryMode === 'schedule' ? addBusinessDays(delayDays) : null

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
              <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600">
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

              {/* Delivery section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Delivery</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="now"
                      checked={deliveryMode === 'now'}
                      onChange={() => setDeliveryMode('now')}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Send now</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="schedule"
                      checked={deliveryMode === 'schedule'}
                      onChange={() => setDeliveryMode('schedule')}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Schedule delivery</span>
                  </label>
                </div>

                {deliveryMode === 'schedule' && (
                  <div className="space-y-2">
                    <select
                      value={delayDays}
                      onChange={e => setDelayDays(Number(e.target.value))}
                      className="input w-full"
                    >
                      <option value={1}>1 business day from now</option>
                      <option value={2}>2 business days from now</option>
                      <option value={3}>3 business days from now</option>
                      <option value={4}>4 business days from now</option>
                      <option value={5}>5 business days from now</option>
                    </select>
                    {scheduledDate && (
                      <p className="text-xs text-gray-500">
                        Delivers: {formatDeliveryDate(scheduledDate)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={closeAndReset} className="btn-outline">Cancel</button>
              <button
                onClick={send}
                disabled={sending || !subject.trim() || !body.trim()}
                className="btn-primary flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending
                  ? deliveryMode === 'schedule' ? 'Scheduling…' : 'Sending…'
                  : deliveryMode === 'schedule' ? 'Schedule' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
