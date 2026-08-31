'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PasswordInput } from '@/components/auth/PasswordInput'

function ResetForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''

  const [checking, setChecking] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setChecking(false); return }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => setValidToken(Boolean(d.valid)))
      .catch(() => setValidToken(false))
      .finally(() => setChecking(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not reset your password.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch {
      setError('Something went wrong. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    )
  }

  if (done) {
    return (
      <>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-5">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          You can sign in with your new password now. Taking you to the login page…
        </p>
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
        >
          Go to sign in
        </Link>
      </>
    )
  }

  if (!token || !validToken) {
    return (
      <>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">This link doesn&apos;t work</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Reset links expire after one hour and can only be used once. Request a fresh one and it&apos;ll
          land in your inbox in a few seconds.
        </p>
        <Link
          href="/auth/forgot-password"
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
        >
          Request a new link
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
        <p className="text-gray-500 text-sm mt-1">Use the eye icon to check what you typed</p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex flex-col justify-between w-80 xl:w-96 bg-[#111111] px-10 py-12 flex-shrink-0">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/zb-designs-lockup-white.png" alt="ZB Designs" width={200} height={159} className="mb-8" />
          <h2 className="text-white text-xl font-bold mb-3">Almost there</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Pick something you&apos;ll remember — or save it to your password manager while you&apos;re here.
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
          <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
