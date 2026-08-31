'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Something went wrong.')
      setSent(true)
    } catch {
      setError('Something went wrong. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex flex-col justify-between w-80 xl:w-96 bg-[#111111] px-10 py-12 flex-shrink-0">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/zb-designs-lockup-white.png" alt="ZB Designs" width={200} height={159} className="mb-8" />
          <h2 className="text-white text-xl font-bold mb-3">Locked out?</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Enter the email on your account and we&apos;ll send you a link to choose a new password.
          </p>
        </div>
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} ZB Designs. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/zb-designs-mark.png" alt="ZB Designs" width={72} height={41} />
          </div>

          {sent ? (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#4AFFD2]/20 mb-5">
                <MailCheck className="w-6 h-6 text-[#111111]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                If an account exists for <span className="font-medium text-gray-700">{email}</span>, a reset link
                is on its way. It expires in one hour.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Nothing arrived? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#111111] font-semibold hover:underline"
                >
                  try a different email
                </button>.
              </p>
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
                <p className="text-gray-500 text-sm mt-1">We&apos;ll email you a link to set a new one</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="input w-full"
                    placeholder="you@zbdesigns.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-500">
                Remembered it?{' '}
                <Link href="/auth/login" className="text-[#111111] hover:underline font-semibold">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
