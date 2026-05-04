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

function applyMergeFields(text: string): string {
  let result = text
  for (const [key, value] of Object.entries(PREVIEW_DATA)) {
    result = result.replaceAll(key, value)
  }
  return result
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const APP_DEFAULT_SUBJECT = `Your application is in, {{firstName}}! Here's what happens next.`
const APP_DEFAULT_BODY = `Hi {{firstName}},

We received your application for the {{jobTitle}} role and we're glad you're interested in joining the team!

We take hiring seriously around here, almost as seriously as we take making the best toys on the planet. Our team will review your application and typically follow up within 3 to 5 business days.

ZB Designs is the creative studio behind Wigglitz, the wiggly, fidgety collectible toy made right here in Ogden, UT and taking over desks, pockets, and social feeds everywhere. If you're joining us, you're joining a team that moves fast, thinks big, and has a lot of fun doing it.

If you have any questions in the meantime, feel free to reply directly to this email.

Thanks again, we'll be in touch soon!

The Wigglitz Talent Team`

const HIRED_DEFAULT_SUBJECT = `Welcome to the Wigglitz team, {{firstName}}!`
const HIRED_DEFAULT_BODY = `Hi {{firstName}},

On behalf of everyone here at Wigglitz by ZB Designs — welcome to the team! We are genuinely thrilled to have you on board and can't wait to see the impact you'll make.

You've been an outstanding candidate throughout this process, and we have full confidence you're going to be a fantastic addition to our crew. We're building something exciting here, and you're now a part of it.

Here's what to expect next:

• You will receive a separate onboarding email from Homebase — please keep an eye out for it and complete all requested information as soon as possible. This helps us get everything set up on our end before your first day.
• Your manager will be reaching out shortly with details about your start date, schedule, and what to expect on day one.
• If you have any questions in the meantime, don't hesitate to reach out — we're here to help.

We're so glad you're joining us. The best is ahead!

Warmly,
Chase Kimball
Head of Talent Acquisition · Wigglitz by ZB Designs
435.890.8542 · chase@wigglitz.com`

// ── AutomationCard ────────────────────────────────────────────────────────────

function AutomationCard({
  type,
  title,
  description,
  defaultSubject,
  defaultBody,
  initialData,
}: {
  type: string
  title: string
  description: string
  defaultSubject: string
  defaultBody: string
  initialData?: { subject: string; body: string; enabled: boolean } | null
}) {
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [subject, setSubject] = useState(initialData?.subject ?? defaultSubject)
  const [body, setBody] = useState(initialData?.body ?? defaultBody)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const previewSubject = applyMergeFields(subject)
  const previewBody    = applyMergeFields(body)

  function insertAtCursor(field: string) {
    const el = bodyRef.current
    if (!el) { setBody(b => b + field); return }
    const start = el.selectionStart
    const end   = el.selectionEnd
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
        body: JSON.stringify({ type, subject, body, enabled }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
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

        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          enabled ? 'bg-[#4AFFD2]/20 text-emerald-800' : 'bg-gray-100 text-gray-500'
        }`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>

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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#111111] px-5 py-3">
              <span className="text-white font-black text-base tracking-tight">Wigglitz</span>
            </div>
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
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<{ type: string; subject: string; body: string; enabled: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then((list: { type: string; subject: string; body: string; enabled: boolean }[]) => {
        setAutomations(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const appData    = automations.find(a => a.type === 'APPLICATION_CONFIRMATION') ?? null
  const hiredData  = automations.find(a => a.type === 'HIRED_CONFIRMATION') ?? null

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-screen-xl space-y-10">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-gray-900">Email Automations</h1>
        <p className="text-sm text-gray-500 mt-1">Configure automated emails sent to candidates at key moments.</p>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">Application Received</h2>
        </div>
        <AutomationCard
          type="APPLICATION_CONFIRMATION"
          title="Application Confirmation"
          description="Sent to the candidate immediately after they submit an application."
          defaultSubject={APP_DEFAULT_SUBJECT}
          defaultBody={APP_DEFAULT_BODY}
          initialData={appData}
        />
      </section>

      <div className="border-t border-gray-100" />

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">Candidate Hired</h2>
        </div>
        <AutomationCard
          type="HIRED_CONFIRMATION"
          title="Welcome to the Team"
          description="Sent automatically when a candidate's stage is moved to Hired."
          defaultSubject={HIRED_DEFAULT_SUBJECT}
          defaultBody={HIRED_DEFAULT_BODY}
          initialData={hiredData}
        />
      </section>
    </div>
  )
}
