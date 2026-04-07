'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'

interface KickoffData {
  openReason?: string
  backfillFor?: string
  urgency?: string
  targetStartDate?: string
  hardDeadlineNotes?: string
  mustHaves?: string
  niceToHaves?: string
  redFlags?: string
  idealCandidate?: string
  teamSize?: string
  teamContext?: string
  successAt90Days?: string
  equityOffered?: boolean
  equityDetails?: string
  bonusOffered?: boolean
  bonusDetails?: string
  additionalPerks?: string
  interviewProcessNotes?: string
  hiringManagerNotes?: string
  completedAt?: string | null
}

interface Props {
  jobId: string
  initialData: KickoffData
  jobTitle: string
  salaryMin?: number | null
  salaryMax?: number | null
}

function Section({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-100">{children}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
const textareaCls = `${inputCls} resize-none`
const selectCls = `${inputCls} bg-white`

export function KickoffForm({ jobId, initialData, salaryMin, salaryMax }: Props) {
  const [form, setForm] = useState<KickoffData>(initialData)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const set = useCallback((field: keyof KickoffData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setDirty(true)
  }, [])

  async function save(markComplete?: boolean) {
    setSaving(true)
    try {
      const payload: KickoffData = { ...form }
      if (markComplete) {
        payload.completedAt = new Date().toISOString()
      }
      const res = await fetch(`/api/jobs/${jobId}/kickoff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      const saved = await res.json()
      setForm(saved)
      setDirty(false)
      setLastSaved(new Date())
      if (markComplete) toast.success('Kick-off marked as complete!')
      else toast.success('Saved')
    } catch {
      toast.error('Could not save — please try again')
    } finally {
      setSaving(false)
    }
  }

  const isComplete = !!form.completedAt

  const completionFields: (keyof KickoffData)[] = [
    'openReason', 'urgency', 'mustHaves', 'niceToHaves', 'idealCandidate',
    'teamContext', 'successAt90Days', 'interviewProcessNotes',
  ]
  const filledCount = completionFields.filter(f => form[f] && String(form[f]).trim()).length
  const progressPct = Math.round((filledCount / completionFields.length) * 100)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Job Kick-off</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill this out with your hiring manager before sourcing begins.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lastSaved && !dirty && (
            <span className="text-xs text-gray-400">Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {dirty && (
            <button
              onClick={() => save()}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {!isComplete ? (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Mark Complete
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Form completion</span>
          <span className="text-xs font-semibold text-gray-900">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {completionFields.map(f => (
            <div key={f} className="flex items-center gap-1">
              {form[f] && String(form[f]).trim()
                ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                : <Circle className="w-3 h-3 text-gray-300" />
              }
              <span className="text-xs text-gray-500 capitalize">{f.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Why This Role */}
      <Section title="Why This Role" subtitle="Context on why this position is open">
        <Field label="Reason for opening">
          <select value={form.openReason ?? ''} onChange={e => set('openReason', e.target.value || null)} className={selectCls}>
            <option value="">Select a reason…</option>
            <option value="new_headcount">New headcount — growing the team</option>
            <option value="backfill">Backfill — replacing someone</option>
            <option value="expansion">Expansion / reorganization</option>
          </select>
        </Field>

        {form.openReason === 'backfill' && (
          <Field label="Who is this backfilling?" hint="Name or role of the person who left">
            <input
              type="text"
              value={form.backfillFor ?? ''}
              onChange={e => set('backfillFor', e.target.value)}
              placeholder="e.g. Jane Smith (Account Executive)"
              className={inputCls}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Urgency">
            <select value={form.urgency ?? ''} onChange={e => set('urgency', e.target.value || null)} className={selectCls}>
              <option value="">Select urgency…</option>
              <option value="asap">ASAP — needed in &lt; 30 days</option>
              <option value="1_2_months">1–2 months</option>
              <option value="3_plus_months">3+ months</option>
              <option value="flexible">Flexible / no hard deadline</option>
            </select>
          </Field>
          <Field label="Target start date">
            <input
              type="date"
              value={form.targetStartDate ? form.targetStartDate.split('T')[0] : ''}
              onChange={e => set('targetStartDate', e.target.value || null)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Deadline notes" hint="Any hard dates, board commitments, or launch dependencies?">
          <input
            type="text"
            value={form.hardDeadlineNotes ?? ''}
            onChange={e => set('hardDeadlineNotes', e.target.value)}
            placeholder="e.g. Must be hired before Q3 product launch"
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Section 2: The Ideal Hire */}
      <Section title="The Ideal Hire" subtitle="Define the bar — what you're looking for and what would disqualify someone">
        <Field label="Must-haves" hint="Non-negotiable skills, experience, or qualities">
          <textarea
            rows={4}
            value={form.mustHaves ?? ''}
            onChange={e => set('mustHaves', e.target.value)}
            placeholder="e.g.&#10;• 5+ years of B2B SaaS sales experience&#10;• Proven track record of closing $50k+ deals&#10;• Strong written communication"
            className={textareaCls}
          />
        </Field>

        <Field label="Nice-to-haves" hint="Would love to see, but not required">
          <textarea
            rows={3}
            value={form.niceToHaves ?? ''}
            onChange={e => set('niceToHaves', e.target.value)}
            placeholder="e.g.&#10;• Experience in the healthcare vertical&#10;• Familiarity with Salesforce&#10;• Has built out a sales process from scratch"
            className={textareaCls}
          />
        </Field>

        <Field label="Red flags" hint="What would disqualify a candidate immediately?">
          <textarea
            rows={3}
            value={form.redFlags ?? ''}
            onChange={e => set('redFlags', e.target.value)}
            placeholder="e.g.&#10;• Job hopping — less than 1 year at most companies&#10;• No experience managing a quota&#10;• Poor communication in early interactions"
            className={textareaCls}
          />
        </Field>

        <Field label="Describe your ideal hire" hint="If you could clone someone — who would it be and why? Or describe the profile in plain language.">
          <textarea
            rows={4}
            value={form.idealCandidate ?? ''}
            onChange={e => set('idealCandidate', e.target.value)}
            placeholder="e.g. Someone like Sarah on our current team — scrappy, great with customers, doesn't need to be managed closely. Probably came up through SDR/BDR and worked their way to AE. Hungry, but not in an entitled way."
            className={textareaCls}
          />
        </Field>
      </Section>

      {/* Section 3: Team & Context */}
      <Section title="Team & Context" subtitle="Help the recruiter understand the opportunity and the environment">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Team size" hint="How many people are on the team they're joining?">
            <input
              type="text"
              value={form.teamSize ?? ''}
              onChange={e => set('teamSize', e.target.value)}
              placeholder="e.g. 6 people (3 AEs, 2 SDRs, 1 manager)"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Team & opportunity context" hint="What is the team working on? What's exciting about this role right now?">
          <textarea
            rows={4}
            value={form.teamContext ?? ''}
            onChange={e => set('teamContext', e.target.value)}
            placeholder="e.g. We're entering a new mid-market segment with strong early traction. This is the 2nd AE hire — they'll have significant influence on how we build the playbook and will be working directly with the VP of Sales."
            className={textareaCls}
          />
        </Field>

        <Field label="Success at 90 days" hint="What does a great first 90 days look like for this person?">
          <textarea
            rows={3}
            value={form.successAt90Days ?? ''}
            onChange={e => set('successAt90Days', e.target.value)}
            placeholder="e.g. Has ramped on the product, run 20+ discovery calls, closed their first deal, and is actively building their pipeline independently."
            className={textareaCls}
          />
        </Field>
      </Section>

      {/* Section 4: Compensation */}
      <Section title="Compensation & Perks" subtitle="Details beyond base salary" defaultOpen={false}>
        {(salaryMin || salaryMax) && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 mb-2">
            Base salary on job: <span className="font-semibold text-gray-900">
              {salaryMin && salaryMax
                ? `$${salaryMin.toLocaleString()} – $${salaryMax.toLocaleString()}`
                : salaryMin
                ? `From $${salaryMin.toLocaleString()}`
                : `Up to $${salaryMax?.toLocaleString()}`}
            </span> · Edit on the Overview tab
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => set('equityOffered', !form.equityOffered)}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.equityOffered ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}`}
            >
              {form.equityOffered && <span className="text-white text-xs font-bold">✓</span>}
            </button>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">Equity is part of the package</span>
              {form.equityOffered && (
                <input
                  type="text"
                  value={form.equityDetails ?? ''}
                  onChange={e => set('equityDetails', e.target.value)}
                  placeholder="e.g. 0.05–0.1% options, 4-year vest, 1-year cliff"
                  className={`${inputCls} mt-2`}
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => set('bonusOffered', !form.bonusOffered)}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.bonusOffered ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}`}
            >
              {form.bonusOffered && <span className="text-white text-xs font-bold">✓</span>}
            </button>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">Bonus / variable comp</span>
              {form.bonusOffered && (
                <input
                  type="text"
                  value={form.bonusDetails ?? ''}
                  onChange={e => set('bonusDetails', e.target.value)}
                  placeholder="e.g. Up to 20% of base, paid quarterly based on quota attainment"
                  className={`${inputCls} mt-2`}
                />
              )}
            </div>
          </div>
        </div>

        <Field label="Additional perks or benefits" hint="Anything else worth highlighting to candidates?">
          <textarea
            rows={3}
            value={form.additionalPerks ?? ''}
            onChange={e => set('additionalPerks', e.target.value)}
            placeholder="e.g. Remote-first, unlimited PTO, $1,500 annual learning budget, full health/dental/vision"
            className={textareaCls}
          />
        </Field>
      </Section>

      {/* Section 5: Interview Process */}
      <Section title="Interview Process" subtitle="How will you evaluate candidates?" defaultOpen={false}>
        <Field
          label="Process notes"
          hint="Describe each stage and what it's designed to evaluate. This helps calibrate the entire team."
        >
          <textarea
            rows={6}
            value={form.interviewProcessNotes ?? ''}
            onChange={e => set('interviewProcessNotes', e.target.value)}
            placeholder={`e.g.\n1. Recruiter screen (30 min) — background, motivation, comp alignment\n2. Hiring manager interview (45 min) — career trajectory, deal experience, curiosity\n3. Panel: AE + Product (60 min) — mock discovery call, product intuition\n4. Executive conversation (30 min) — culture, long-term fit\n5. References (2–3) — verify performance, working style`}
            className={textareaCls}
          />
        </Field>
      </Section>

      {/* Section 6: Notes */}
      <Section title="Hiring Manager Notes" subtitle="Anything else the recruiting team should know" defaultOpen={false}>
        <Field label="Additional context" hint="Personality traits, things that have mattered in past hires, anything off the record">
          <textarea
            rows={4}
            value={form.hiringManagerNotes ?? ''}
            onChange={e => set('hiringManagerNotes', e.target.value)}
            placeholder="e.g. The last two people we hired for this role didn't work out because they were too process-dependent. We need someone who figures things out on their own. Culture-wise, the team is pretty direct — no sugarcoating."
            className={textareaCls}
          />
        </Field>
      </Section>

      {/* Footer save */}
      <div className="flex items-center justify-between pt-2 pb-8">
        {isComplete && (
          <button
            type="button"
            onClick={() => { set('completedAt', null); setDirty(true) }}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            Reopen kick-off
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {lastSaved && !dirty && (
            <span className="text-xs text-gray-400">Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          <button
            onClick={() => save()}
            disabled={saving || !dirty}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
