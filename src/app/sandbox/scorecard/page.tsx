export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Clapperboard } from 'lucide-react'
import { EvaluationForm } from '@/components/applications/EvaluationForm'

// ── Hardcoded demo template — mirrors a real WHO + scorecard structure ─────────

const DEMO_TEMPLATE = {
  sections: [
    {
      id: 'demo-section-screening',
      title: 'Phone Screen',
      questions: [
        {
          id: 'demo-tq-1',
          questionId: 'demo-q-1',
          required: true,
          question: {
            id: 'demo-q-1',
            text: 'Why are you interested in this role and why now?',
            guidance: 'Listen for genuine motivation and timing — are they running toward something or away from something?',
            aPlayerAnswer: 'Clear, specific reasons tied to their career goals and this company. Knows what they want and why this role fits.',
            bPlayerAnswer: 'General interest in the role. Likes the company but can\'t articulate specifics.',
            cPlayerAnswer: 'Vague or primarily driven by compensation/benefits with no real interest in the role.',
          },
        },
        {
          id: 'demo-tq-2',
          questionId: 'demo-q-2',
          required: true,
          question: {
            id: 'demo-q-2',
            text: 'Walk me through your relevant experience.',
            guidance: 'Look for clear progression, ownership of outcomes, and specifics — not just job descriptions.',
            aPlayerAnswer: 'Concise, structured story with specific results and clear progression. Takes ownership.',
            bPlayerAnswer: 'Good experience but tells it as a list of duties rather than owned outcomes.',
            cPlayerAnswer: 'Scattered, hard to follow, or can\'t connect past experience to this role.',
          },
        },
      ],
    },
    {
      id: 'demo-section-behavioral',
      title: 'Behavioral Interview',
      questions: [
        {
          id: 'demo-tq-3',
          questionId: 'demo-q-3',
          required: true,
          question: {
            id: 'demo-q-3',
            text: 'Tell me about a time you had to hit an aggressive goal. How did you approach it?',
            guidance: 'Look for proactive planning, accountability, and grit when things got hard.',
            aPlayerAnswer: 'Sets a clear plan, identifies obstacles early, adapts, and hits the goal. Takes full accountability.',
            bPlayerAnswer: 'Decent approach but relied heavily on team or luck. Partial ownership.',
            cPlayerAnswer: 'Missed the goal or blames external factors. Reactive rather than proactive.',
          },
        },
        {
          id: 'demo-tq-4',
          questionId: 'demo-q-4',
          required: false,
          question: {
            id: 'demo-q-4',
            text: 'Describe a situation where you disagreed with a decision made by your manager. What did you do?',
            guidance: 'Looking for professional push-back, ability to advocate with data, and knowing when to commit.',
            aPlayerAnswer: 'Voiced concern clearly, with data or reasoning, then committed fully once decision was made.',
            bPlayerAnswer: 'Raised concern but did it poorly or grudgingly committed.',
            cPlayerAnswer: 'Either didn\'t push back at all or went around the manager / caused drama.',
          },
        },
      ],
    },
  ],
}

// ── Fake resume PDF path — points to a publicly available demo PDF ─────────
const DEMO_RESUME_URL = true // we'll show a placeholder instead of a real file

export default async function SandboxScorecardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const role = (session?.user as any)?.role as string
  if (role !== 'ADMIN') redirect('/dashboard')

  const currentUserName = (session?.user as any)?.name as string ?? 'Demo Interviewer'

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-4">
        <Link
          href="/sandbox/interviewer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          My interviews
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-gray-900">Submit Evaluation</span>
          <span className="text-sm text-gray-400 ml-2">
            Jordan Lee — Sales Representative
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-3 py-1">
          <Clapperboard className="w-3.5 h-3.5" />
          Sandbox
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Resume placeholder */}
        <div className="hidden lg:flex flex-col w-[48%] border-r border-gray-200 bg-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">Jordan Lee — Resume</span>
          </div>
          {/* Demo resume — show a realistic placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center bg-white m-4 rounded-lg border border-gray-200 shadow-sm px-8 py-12 gap-4">
            <div className="w-full max-w-sm space-y-4 text-left">
              <div>
                <div className="h-6 w-40 bg-gray-800 rounded mb-1" />
                <div className="h-3 w-56 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded mt-1" />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="h-3 w-24 bg-gray-400 rounded mb-2" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                <div className="h-3 w-5/6 bg-gray-100 rounded mb-1" />
                <div className="h-3 w-4/6 bg-gray-100 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="h-3 w-24 bg-gray-400 rounded mb-2" />
                <div className="h-3 w-48 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                <div className="h-3 w-5/6 bg-gray-100 rounded mb-1" />
                <div className="h-3 w-3/6 bg-gray-100 rounded" />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="h-3 w-24 bg-gray-400 rounded mb-2" />
                <div className="h-3 w-40 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                <div className="h-3 w-4/6 bg-gray-100 rounded" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 italic">
              Resume preview — real uploads appear here as a live PDF
            </p>
          </div>
        </div>

        {/* Right — Evaluation form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl">
            <EvaluationForm
              applicationId="sandbox"
              interviewers={[]}
              template={DEMO_TEMPLATE as any}
              initialEntries={[]}
              availableStart={null}
              salaryExpectation={null}
              currentUserName={currentUserName}
              currentUserId="sandbox"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
