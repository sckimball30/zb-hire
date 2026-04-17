export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, ClipboardCheck, Clapperboard } from 'lucide-react'

const DEMO_EVALUATIONS = [
  {
    id: 'eval-1',
    sectionTitle: 'Phone Screen',
    interviewerName: 'Rachel Kim',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dominantRating: 'A',
    ratingColor: 'bg-green-100 text-green-700',
    responses: [
      { rating: 'A', notes: 'Very clear about why they want this role — tied it directly to their background in B2B sales and a specific goal to move into enterprise deals. Came across as genuinely motivated, not just job-hunting.' },
      { rating: 'A', notes: 'Strong track record. Walked through 3 roles with clear progression and specific numbers (closed $1.2M in ARR last year). Owns their results — didn\'t deflect to team wins.' },
    ],
  },
  {
    id: 'eval-2',
    sectionTitle: 'Behavioral Interview',
    interviewerName: 'Marcus Webb',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dominantRating: 'A',
    ratingColor: 'bg-green-100 text-green-700',
    responses: [
      { rating: 'A', notes: 'Gave a great example — was handed a territory with no pipeline, built from scratch in 90 days, hit 110% of quota. Had a clear system and didn\'t wait to be told what to do.' },
      { rating: 'B', notes: 'Pushed back on a manager\'s call to drop a struggling account. Did it professionally, brought data, ultimately committed when the decision stood. Could have been more proactive earlier but handled it well.' },
    ],
  },
]

export default async function SandboxJordanLeePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const role = (session?.user as any)?.role as string
  if (role !== 'ADMIN') redirect('/dashboard')

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
            <span className="ml-2 text-white/40 text-xs">Hiring Manager Portal</span>
          </div>
        </div>
        <Link href="/dashboard" className="text-xs text-white/50 hover:text-white/80 border border-white/20 rounded-md px-3 py-1.5 transition-colors">
          ← Exit Sandbox
        </Link>
      </div>

      <div className="bg-amber-500 text-white text-center text-xs font-semibold py-1.5 flex items-center justify-center gap-2">
        <Clapperboard className="w-3.5 h-3.5" />
        Sandbox mode — demo data only, nothing is saved
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <Link href="/sandbox/hiring-manager" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to my candidates
        </Link>

        {/* Candidate card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex items-center justify-center flex-shrink-0">
              JL
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Jordan Lee</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Sales Representative · Sales</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mt-1">
                  Interview
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-xs text-gray-400">jordan.lee@email.com</span>
                <span className="text-xs text-gray-400">(555) 012-3456</span>
              </div>
            </div>
          </div>

          {/* Interview history */}
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Interview history</p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <span className="text-gray-500 text-xs">{new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at 10:00 AM</span>
              <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">Phone Screen</span>
              <span className="text-xs text-gray-400">with Rachel Kim</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <span className="text-gray-500 text-xs">{new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at 2:00 PM</span>
              <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">Behavioral</span>
              <span className="text-xs text-gray-400">with Marcus Webb</span>
            </div>
          </div>
        </div>

        {/* Resume skeleton */}
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
          <div className="px-10 py-10 bg-white">
            <div className="max-w-lg mx-auto space-y-5">
              <div>
                <div className="h-7 w-40 bg-gray-800 rounded mb-2" />
                <div className="h-3 w-64 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-52 bg-gray-200 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="h-3.5 w-24 bg-gray-400 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-5/6 bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-4/6 bg-gray-100 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="h-3.5 w-28 bg-gray-400 rounded mb-3" />
                <div className="h-3 w-56 bg-gray-300 rounded mb-1" />
                <div className="h-3 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-5/6 bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-4/6 bg-gray-100 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="h-3.5 w-16 bg-gray-400 rounded mb-3" />
                <div className="flex gap-2 flex-wrap">
                  {['B2B Sales', 'Salesforce', 'Pipeline Mgmt', 'Negotiation', 'Cold Outreach'].map(s => (
                    <div key={s} className="h-6 bg-gray-100 rounded-full px-3 flex items-center">
                      <div className="h-2.5 bg-gray-300 rounded" style={{ width: `${s.length * 6}px` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-8 italic">Resume preview — real uploads appear here as a live PDF</p>
          </div>
        </div>

        {/* Evaluations — read only */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Interviewer Evaluations (2)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Feedback submitted by your interview team</p>
          </div>
          <div className="divide-y divide-gray-100">
            {DEMO_EVALUATIONS.map(section => (
              <div key={section.id} className="px-6 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{section.sectionTitle}</p>
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{section.interviewerName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {section.submittedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${section.ratingColor}`}>
                      {section.dominantRating} Player
                    </span>
                  </div>
                  <div className="space-y-3">
                    {section.responses.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`mt-0.5 inline-flex items-center px-1.5 py-0 rounded text-xs font-bold flex-shrink-0 ${
                          r.rating === 'A' ? 'bg-green-100 text-green-700' :
                          r.rating === 'B' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.rating}
                        </span>
                        <p className="text-gray-600 text-xs leading-relaxed">{r.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hire decision — demo (no-op form) */}
        <SandboxHireDecision />
      </div>
    </div>
  )
}

function SandboxHireDecision() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Hire Decision (0)</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-md px-3 py-1.5">
          <ClipboardCheck className="w-3.5 h-3.5" /> Submit My Evaluation
        </span>
      </div>
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-gray-500">
          No evaluations submitted yet.{' '}
          <span className="text-blue-600">Be the first.</span>
        </p>
        <p className="text-xs text-gray-400 mt-3 italic">
          In the real app, clicking &quot;Submit My Evaluation&quot; opens a structured WHO scorecard for your hire/no-hire decision.
        </p>
      </div>
    </div>
  )
}
