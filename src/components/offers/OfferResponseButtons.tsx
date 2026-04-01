'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  token: string
}

export function OfferResponseButtons({ token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'ACCEPT' | 'DECLINE' | null>(null)
  const [responded, setResponded] = useState<'ACCEPTED' | 'DECLINED' | null>(null)
  const [signatureName, setSignatureName] = useState('')
  const [confirmedDecline, setConfirmedDecline] = useState(false)

  const handleAccept = async () => {
    if (signatureName.trim().length <= 2) return
    setLoading('ACCEPT')
    try {
      const res = await fetch(`/api/offers/token/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT', signatureName: signatureName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to respond to offer')
      }

      setResponded('ACCEPTED')
      toast.success('Offer accepted and signed!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const handleDecline = async () => {
    setLoading('DECLINE')
    try {
      const res = await fetch(`/api/offers/token/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINE' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to respond to offer')
      }

      setResponded('DECLINED')
      toast.success('Offer declined.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (responded === 'ACCEPTED') {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-green-800">✓ Offer Accepted &amp; Signed</div>
          <div className="text-sm text-green-600">A signed copy will be emailed to you shortly.</div>
        </div>
      </div>
    )
  }

  if (responded === 'DECLINED') {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-gray-700">You have declined this offer.</div>
          <div className="text-sm text-gray-500">Thank you for letting us know.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sign to Accept box */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="text-sm font-semibold text-gray-800">Sign to Accept</div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Type your full name to sign</label>
          <input
            type="text"
            value={signatureName}
            onChange={e => setSignatureName(e.target.value)}
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-base italic font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4AFFD2] focus:border-transparent transition-shadow"
            style={{ fontStyle: 'italic', fontSize: '1.05rem' }}
            disabled={loading !== null}
          />
        </div>
        <p className="text-xs text-gray-400">
          By signing, you agree to the terms of this offer under the ESIGN Act.
        </p>
        <button
          onClick={handleAccept}
          disabled={loading !== null || signatureName.trim().length <= 2}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-colors bg-[#111111] text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'ACCEPT' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Accepting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept Offer
            </>
          )}
        </button>
      </div>

      {/* Decline section */}
      {!confirmedDecline ? (
        <button
          onClick={() => setConfirmedDecline(true)}
          disabled={loading !== null}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-colors border border-red-300 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Decline Offer
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm text-red-700 font-medium">Are you sure you want to decline this offer?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              disabled={loading !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'DECLINE' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Declining...
                </>
              ) : (
                'Yes, Decline'
              )}
            </button>
            <button
              onClick={() => setConfirmedDecline(false)}
              disabled={loading !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
