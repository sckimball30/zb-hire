'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, MapPin, DollarSign, Upload, X, FileText } from 'lucide-react'

type Job = {
  id: string
  title: string
  department: string | null
  location: string | null
  description: string | null
  employmentType: string | null
  payType: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time',
  CONTRACT: 'Contract', INTERNSHIP: 'Internship', TEMPORARY: 'Temporary',
}

function formatComp(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: job.salaryCurrency, maximumFractionDigits: 0 }).format(n)
  const range = job.salaryMin && job.salaryMax
    ? `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
    : job.salaryMin ? `From ${fmt(job.salaryMin)}` : `Up to ${fmt(job.salaryMax!)}`
  const suffix = job.payType === 'HOURLY' ? '/hr' : '/yr'
  return range + suffix
}

export default function PublicApplyPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', linkedInUrl: '', coverLetter: '',
  })

  useEffect(() => {
    fetch(`/api/apply/${jobId}`)
      .then(async r => {
        if (r.ok) return { ok: true, data: await r.json() }
        const d = await r.json().catch(() => ({}))
        return { ok: false, error: d.error }
      })
      .then(({ ok, data, error }: any) => {
        if (ok) setJob(data)
        else if (error === 'draft') setIsDraft(true)
        else if (error === 'closed') setIsClosed(true)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [jobId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > 10 * 1024 * 1024) {
      setError('Resume file must be under 10 MB.')
      return
    }
    setResumeFile(file)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (!form.phone.trim()) { setError('Phone number is required.'); return }
    if (!form.address.trim()) { setError('Address is required.'); return }
    if (!form.linkedInUrl.trim()) { setError('LinkedIn URL is required.'); return }
    if (!resumeFile) { setError('Please upload your resume.'); return }

    setError('')
    setSubmitting(true)

    const fd = new FormData()
    fd.append('firstName', form.firstName.trim())
    fd.append('lastName', form.lastName.trim())
    fd.append('email', form.email.trim())
    fd.append('phone', form.phone.trim())
    fd.append('address', form.address.trim())
    fd.append('linkedInUrl', form.linkedInUrl.trim())
    fd.append('coverLetter', form.coverLetter.trim())
    fd.append('resume', resumeFile)

    const res = await fetch(`/api/apply/${jobId}`, { method: 'POST', body: fd })
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Something went wrong. Please try again.')
    }
  }

  // ── Status screens ──────────────────────────────────────────────────────────

  if (isDraft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <WigglitzLogo />
          <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4 mt-8">
            <span className="text-2xl">🚧</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">This job isn't live yet</h1>
          <p className="text-gray-500 text-sm">
            This position is still in <strong>Draft</strong> status. Go to the job page and click{' '}
            <strong>"Publish (set to Open)"</strong> to make it accept applications.
          </p>
        </div>
      </div>
    )
  }

  if (isClosed || notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <WigglitzLogo />
          <p className="text-gray-500 text-lg font-medium mt-8">This position is no longer accepting applications.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new openings at Wigglitz!</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#4AFFD2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <WigglitzLogo />
          <div className="mt-8 mb-4">
            <CheckCircle2 className="w-16 h-16 text-[#4AFFD2] mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-500">
            Thank you for applying for <strong>{job.title}</strong> at Wigglitz. We'll be in touch soon!
          </p>
        </div>
      </div>
    )
  }

  const comp = formatComp(job)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded header banner */}
      <div className="bg-white py-8 px-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
          <WigglitzLogo />
          <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Careers</p>
        </div>
      </div>

      {/* Colorful accent bar */}
      <div className="h-1.5 flex">
        <div className="flex-1 bg-[#4AFFD2]" />
        <div className="flex-1 bg-[#F26D77]" />
        <div className="flex-1 bg-[#F5D020]" />
        <div className="flex-1 bg-[#3AADE0]" />
        <div className="flex-1 bg-[#4AFFD2]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Job info */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {job.department && <span className="text-gray-500 text-sm">{job.department}</span>}
            {job.location && (
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />{job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="bg-[#4AFFD2]/20 text-[#1a9e82] text-xs font-semibold px-2.5 py-1 rounded-full">
                {EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}
              </span>
            )}
            {comp && (
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <DollarSign className="w-3.5 h-3.5" />{comp}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">About this role</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        {/* Application Form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Apply for this position</h2>
          <p className="text-xs text-gray-400 mb-5">Fields marked <span className="text-red-500">*</span> are required</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name <span className="text-red-500">*</span>
                </label>
                <input name="firstName" value={form.firstName} onChange={handleChange}
                  required className="input w-full" placeholder="Jane" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input name="lastName" value={form.lastName} onChange={handleChange}
                  required className="input w-full" placeholder="Smith" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                required className="input w-full" placeholder="jane@example.com" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number <span className="text-red-500">*</span>
              </label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                required className="input w-full" placeholder="+1 (555) 000-0000" />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input name="address" value={form.address} onChange={handleChange}
                required className="input w-full" placeholder="123 Main St, City, State, ZIP" />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn profile URL <span className="text-red-500">*</span>
              </label>
              <input type="url" name="linkedInUrl" value={form.linkedInUrl} onChange={handleChange}
                required className="input w-full" placeholder="https://linkedin.com/in/yourname" />
            </div>

            {/* Resume upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {resumeFile ? (
                <div className="flex items-center gap-3 p-3 bg-[#4AFFD2]/10 border border-[#4AFFD2]/30 rounded-lg">
                  <FileText className="w-5 h-5 text-[#1a9e82] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{resumeFile.name}</p>
                    <p className="text-xs text-gray-500">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#4AFFD2] hover:bg-[#4AFFD2]/5 transition-colors group"
                >
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1a9e82] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-[#1a9e82]">Click to upload resume</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 10 MB</p>
                </button>
              )}
            </div>

            {/* Cover Letter — optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover letter
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea name="coverLetter" value={form.coverLetter} onChange={handleChange}
                rows={5} className="input w-full resize-none text-sm"
                placeholder="Tell us why you're a great fit for this role…" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-[#111111] text-white text-base font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Your information will be used solely for this job application.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-500">ZB Designs</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function WigglitzLogo() {
  return (
    <div className="flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/wigglitz-logo.png"
        alt="The Original Wigglitz"
        className="h-20 w-auto object-contain"
      />
    </div>
  )
}
