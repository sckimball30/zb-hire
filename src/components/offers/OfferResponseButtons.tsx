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

  const handleRespond = async (action: 'ACCEPT' | 'DECLINE') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/offers/token/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to respond to offer')
      }

      setResponded(action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED')
      toast.success(action === 'ACCEPT' ? 'Offer accepted!' : 'Offer declined.')
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
          <div className="font-semibold text-green-800">You have accepted this offer!</div>
          <div className="text-sm text-green-600">We will be in touch shortly with next steps.</div>
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
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={() => handleRespond('ACCEPT')}
        disabled={loading !== null}
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-colors bg-[#111111] text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <button
        onClick={() => handleRespond('DECLINE')}
        disabled={loading !== null}
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-colors border border-red-300 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Decline Offer
          </>
        )}
      </button>
    </div>
  )
}
