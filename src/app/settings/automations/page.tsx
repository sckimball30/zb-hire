'use client'

import { useEffect, useRef, useState } from 'react'

const MERGE_FIELDS = [
  '{{firstName}}',
  '{{fullName}}',
  '{{jobTitle}}',
  '{{department}}',
  '{{companyName}}',
]

const PREVIEW_DATA: Record<string, string> = {
  '{{firstName}}': 'Alex',
  '{{fullName}}': 'Alex Rivera',
  '{{jobTitle}}': 'Social Media Content Creator',
  '{{department}}': 'Marketing',
  '{{companyName}}': 'Wigglitz',
}

const DEFAULT_SUBJECT = `Your application is in, {{firstName}}! Here's what happens next.`

const DEFAULT_BODY = `Hi {{firstName}},

We received your application for the {{jobTitle}} role and we're glad you're interested in joining the team!

We take hiring seriously around here, almost as seriously as we take making the best toys on the planet. Our team will review your application and typically follow up within 3 to 5 business days.

ZB Designs is the creative studio behind Wigglitz, the wiggly, fidgety collectible toy made right here in Ogden, UT and taking over desks, pockets, and social feeds everywhere. If you're joining us, you're joining a team that moves fast, thinks big, and has a lot of fun doing it.

If you have any questions in the meantime, feel free to reply directly to this email.

Thanks again, we'll be in touch soon!

The Wigglitz Talent Team`

function applyMergeFields(text: string): string {
  let result = text
  for (const [key, value] of Object.entries(PREVIEW_DATA)) {
    result = result.replaceAll(key, value)
  }
  return result
}

export default function AutomationsPage() {
  const [enabled, setEnabled] = useState(true)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then((list: { type: string; subject: string; body: string; enabled: boolean }[]) => {
        const automation = list.find(a => a.type === 'APPLICATION_CONFIRMATION')
        if (automation) {
          setSubject(automation.subject)
          setBody(automation.body)
          setEnabled(automation.enabled)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function insertAtCursor(field: string) {
    const el = bodyRef.current
    if (!el) { setBody(b => b + field); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = body.slice(0, start) + field + body.slice(end)
    setBody(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + field.length, start + field.length)
    }, 0)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'APPLICATION_CONFIRMATION', subject, body, enabled }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const previewSubject = applyMergeFields(subject)
  const previewBody = applyMergeFields(body)

  return (
    <div className="p-8 max-w-screen-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Email Automations</h1>
        <p className="text-sm text-gray-500 mt-1">Configure automated emails sent to candidates.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Application Confirmation</p>
              <p className="text-xs text-gray-500 mt-0.5">Sent to the candidate after they submit an application.</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(e => !e)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                enabled ? 'bg-[#4AFFD2]' : 'bg-gray-300'
              }`}
              aria-pressed={enabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!loading && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              enabled ? 'bg-[#4AFFD2]/20 text-emerald-800' : 'bg-gray-100 text-gray-500'
            }`}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          )}

          <div>
            <label className="label">Subject</label>
            <input
              type="text"
              className="input w-full"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Body</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MERGE_FIELDS.map(field => (
                <button
                  key={field}
                  type="button"
                  onClick={() => insertAtCursor(field)}
                  className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 hover:bg-[#4AFFD2]/20 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-[#4AFFD2] transition-colors"
                >
                  {field}
                </button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              className="input w-full font-mono text-sm resize-none"
              rows={16}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Automation'}
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 font-medium">Saved!</span>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Live Preview</p>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            {/* Email chrome */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header bar */}
              <div className="bg-[#111111] px-5 py-3">
                <span className="text-white font-black text-base tracking-tight">Wigglitz</span>
              </div>

              {/* Email meta */}
              <div className="border-b border-gray-100 px-5 py-3 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">From</span>
                  <span className="text-xs text-gray-600">The Wigglitz Talent Team &lt;noreply@wigglitz.com&gt;</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">To</span>
                  <span className="text-xs text-gray-600">alex.rivera@example.com</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">Subject</span>
                  <span className="text-xs font-semibold text-gray-900">{previewSubject}</span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-5">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{previewBody}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Preview uses sample data — actual emails use real candidate info.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
