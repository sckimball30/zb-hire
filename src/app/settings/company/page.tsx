'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'

export default function CompanySettingsPage() {
  const [careersPageUrl, setCareersPageUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(data => {
        setCareersPageUrl(data.careersPageUrl ?? '')
        setCompanyName(data.companyName ?? '')
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careersPageUrl, companyName }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Company settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          These values are used to auto-fill variables in your message templates.
        </p>
      </div>

      {loading ? (
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      ) : (
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
                Careers Page URL
              </label>
              <input
                type="url"
                value={careersPageUrl}
                onChange={e => setCareersPageUrl(e.target.value)}
                placeholder="https://yourcompany.com/careers"
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                This auto-fills the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'{{Careers Page URL}}'}</code> variable in all message templates — no more typing it each time.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 flex justify-end">
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
