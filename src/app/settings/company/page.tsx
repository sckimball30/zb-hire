'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Building2, Globe, Image, ExternalLink, Copy, Check, Upload, X } from 'lucide-react'

export default function CompanySettingsPage() {
  const [careersPageUrl, setCareersPageUrl]       = useState('')
  const [companyName, setCompanyName]             = useState('')
  const [heroHeadline, setHeroHeadline]           = useState('')
  const [heroTagline, setHeroTagline]             = useState('')
  const [careersHeroImageUrl, setCareersHeroImageUrl] = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(data => {
        setCareersPageUrl(data.careersPageUrl ?? '')
        setCompanyName(data.companyName ?? '')
        setHeroHeadline(data.heroHeadline ?? '')
        setHeroTagline(data.heroTagline ?? '')
        setCareersHeroImageUrl(data.careersHeroImageUrl ?? '')
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careersPageUrl, companyName, heroHeadline, heroTagline, careersHeroImageUrl }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/settings/company/hero-image', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setCareersHeroImageUrl(url)
      toast.success('Image uploaded — click Save to apply')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function copyCareersUrl() {
    const url = `${window.location.origin}/careers`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize your public careers page and outbound email variables.
        </p>
      </div>

      {loading ? (
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      ) : (
        <div className="space-y-5">

          {/* Company Info */}
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            <div className="px-6 py-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Company Info</p>
                <p className="text-xs text-gray-400 mt-0.5">Used to personalize outbound emails</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Wigglitz"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Careers Page URL <span className="font-normal text-gray-400">(for email templates)</span>
                </label>
                <input
                  type="url"
                  value={careersPageUrl}
                  onChange={e => setCareersPageUrl(e.target.value)}
                  placeholder="https://yourcompany.com/careers"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Auto-fills <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'{{Careers Page URL}}'}</code> in message templates.
                </p>
              </div>
            </div>
          </div>

          {/* Careers Page */}
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            <div className="px-6 py-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#4AFFD2]/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-[#1a9e82]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Public Careers Page</p>
                  <p className="text-xs text-gray-400 mt-0.5">Share this link on your website</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href="/careers"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview
                </a>
                <button
                  onClick={copyCareersUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Headline</label>
                <input
                  type="text"
                  value={heroHeadline}
                  onChange={e => setHeroHeadline(e.target.value)}
                  placeholder="Come Build Something Joyful"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">The big heading on your careers page hero section.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Tagline</label>
                <textarea
                  value={heroTagline}
                  onChange={e => setHeroTagline(e.target.value)}
                  placeholder="We're looking for creative, driven people to join our team."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1">Subtitle shown below the headline.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Background Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                {careersHeroImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={careersHeroImageUrl} alt="Hero preview" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white text-xs font-semibold text-gray-900 flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> Replace
                      </button>
                      <button
                        onClick={() => setCareersHeroImageUrl('')}
                        className="px-3 py-1.5 rounded-lg bg-white text-xs font-semibold text-red-600 flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#4AFFD2] hover:bg-[#4AFFD2]/5 transition-colors group disabled:opacity-50"
                  >
                    <Image className="w-6 h-6 text-gray-400 group-hover:text-[#1a9e82] mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600 group-hover:text-[#1a9e82]">
                      {uploading ? 'Uploading…' : 'Upload hero image'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Max 10 MB · Recommended 1920×600</p>
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Shows as the background of the hero section. Without an image, a dark solid background is used.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
