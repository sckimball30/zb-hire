export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, FileText, Clapperboard } from 'lucide-react'

export default async function SandboxUpcomingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const role = (session?.user as any)?.role as string
  if (role !== 'ADMIN') redirect('/dashboard')

  const interviewDate = new Date()
  interviewDate.setDate(interviewDate.getDate() + 2)
  interviewDate.setHours(10, 0, 0, 0)
  const formatted = interviewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) +
    ' at 10:00 AM'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#111111] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10">
            <span className="font-black text-sm tracking-tighter">ZB</span>
          </div>
          <div>
            <span className="font-bold text-sm">ZB Hire</span>
            <span className="ml-2 text-white/40 text-xs">Interviewer Portal</span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-white/50 hover:text-white/80 border border-white/20 rounded-md px-3 py-1.5 transition-colors"
        >
          ← Exit Sandbox
        </Link>
      </div>

      {/* Sandbox banner */}
      <div className="bg-amber-500 text-white text-center text-xs font-semibold py-1.5 flex items-center justify-center gap-2">
        <Clapperboard className="w-3.5 h-3.5" />
        Sandbox mode — demo data only, nothing is saved
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        <Link
          href="/sandbox/interviewer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to my interviews
        </Link>

        {/* Candidate card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex items-center justify-center flex-shrink-0">
              AR
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">Alex Rivera</h1>
              <p className="text-sm text-gray-500 mt-0.5">Applying for: <strong>Marketing Manager</strong></p>
              <p className="text-sm text-gray-400">Marketing</p>
              <a
                href="#"
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
              >
                LinkedIn profile ↗
              </a>
            </div>
          </div>

          {/* Interview details */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatted}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              30 min
            </div>
            <span className="inline-flex items-center text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-0.5">
              Phone Screen
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              Phone
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <strong>Notes:</strong> Focus on their experience with digital marketing campaigns and team leadership. Ask about their biggest launch.
          </div>
        </div>

        {/* Upcoming CTA */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Interview coming up</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Review the candidate's profile and resume below to prepare. You'll be able to submit your evaluation after the interview takes place.
              </p>
            </div>
          </div>
        </div>

        {/* Resume — skeleton placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-900">Resume</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 font-medium">
              <FileText className="w-3.5 h-3.5" /> Download
            </span>
          </div>
          {/* Realistic resume skeleton */}
          <div className="px-10 py-10 bg-white">
            <div className="max-w-lg mx-auto space-y-5">
              <div>
                <div className="h-7 w-48 bg-gray-800 rounded mb-2" />
                <div className="h-3 w-64 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-52 bg-gray-200 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="h-3.5 w-28 bg-gray-400 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-5/6 bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-4/6 bg-gray-100 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="h-3.5 w-28 bg-gray-400 rounded mb-3" />
                <div className="h-3 w-52 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-5/6 bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-4/6 bg-gray-100 rounded mb-4" />
                <div className="h-3 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-3/6 bg-gray-100 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="h-3.5 w-28 bg-gray-400 rounded mb-3" />
                <div className="flex gap-2 flex-wrap">
                  {['Marketing Strategy', 'HubSpot', 'SEO/SEM', 'Team Leadership', 'Analytics', 'Content'].map(s => (
                    <div key={s} className="h-6 bg-gray-100 rounded-full px-3 flex items-center">
                      <div className="h-2.5 bg-gray-300 rounded" style={{ width: `${s.length * 6}px` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-8 italic">
              Resume preview — real uploads appear here as a live PDF
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
