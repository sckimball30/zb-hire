'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Briefcase,
  Users,
  GitBranch,
  Inbox,
  UserCheck,
  Settings,
  ClipboardCheck,
  Lightbulb,
  MessageSquare,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   Content definitions
───────────────────────────────────────────── */

interface HelpItem {
  q: string
  a: string
}

interface HelpSection {
  id: string
  icon: React.ElementType
  title: string
  items: HelpItem[]
}

const RECRUITER_SECTIONS: HelpSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    items: [
      {
        q: 'What does the dashboard show?',
        a: 'Open roles, total candidates in the pipeline, new applications this month, and hires this month — all at a glance. The hiring funnel chart shows how candidates are distributed across each stage, and Recent Activity logs every stage move across all jobs.',
      },
      {
        q: 'How do I get back to the dashboard?',
        a: 'Click "Dashboard" in the left sidebar at any time. It\'s always the top item in the nav.',
      },
    ],
  },
  {
    id: 'jobs',
    icon: Briefcase,
    title: 'Jobs',
    items: [
      {
        q: 'How do I create a new job?',
        a: 'Go to Jobs → click "New Job." Fill in the title, department, location, employment type, salary range, and job description. The description editor supports rich text — you can paste formatted content directly from Word or Google Docs and the formatting will be preserved.',
      },
      {
        q: 'How do I view candidates for a job?',
        a: 'From the Jobs list, click "Pipeline" on any job row. This opens the Kanban-style pipeline showing all candidates grouped by stage.',
      },
      {
        q: 'What is the Scorecard Template?',
        a: 'Each job can have a scorecard template — a set of interview questions organized into sections. When an interviewer submits an evaluation, they answer these questions. Set it up under the job\'s Scorecard tab. If no template exists, interviewers still see a blank evaluation form.',
      },
      {
        q: 'How do I add interviewers to a job?',
        a: 'Open the job → go to the Team tab → add interviewers from your list. Only team members assigned to a job will appear in the interview scheduling dropdown for that job\'s candidates.',
      },
      {
        q: 'Can I edit a job after creating it?',
        a: 'Yes. Click the job title from the Jobs list to open the job detail page, then click "Edit Job." You can update any field including the description, salary, and status (Open/Closed/Draft).',
      },
    ],
  },
  {
    id: 'candidates',
    icon: Users,
    title: 'Candidates',
    items: [
      {
        q: 'How do I add a candidate manually?',
        a: 'Go to Candidates → "Add Candidate." Enter their name, email, phone, location, and which job they\'re applying for. You can also upload their resume directly from this form.',
      },
      {
        q: 'How do I search for a candidate?',
        a: 'Use the search bar at the top of the Candidates page to search by name or email. You can also filter by role, tags, or date applied using the dropdowns next to the search bar.',
      },
      {
        q: 'What\'s on a candidate\'s profile?',
        a: 'The full candidate profile shows their contact info, resume, all active and past applications, any notes left by the team, message history, interview events, and scorecard evaluations.',
      },
      {
        q: 'What are tags?',
        a: 'Tags are color-coded labels you can attach to candidates (e.g., "Strong Technical," "Follow Up," "Passive"). They\'re useful for filtering your pipeline. Tags are managed in Settings.',
      },
    ],
  },
  {
    id: 'pipeline',
    icon: GitBranch,
    title: 'Applications & Pipeline',
    items: [
      {
        q: 'How do I move a candidate to a new stage?',
        a: 'Open the application → use the stage selector at the top of the page. Click the stage you want to move them to. A confirmation prompt appears for irreversible moves like Hired or Rejected.',
      },
      {
        q: 'What happens when I reject a candidate?',
        a: 'You\'ll be asked to pick a rejection disposition before confirming — options include Not the Right Fit, Location, Salary Mismatch, Silver Medalist, Do Not Hire, Withdrew, and more. The disposition is saved on the candidate\'s record and shown as a badge on their profile.',
      },
      {
        q: 'How do I schedule an interview?',
        a: 'Open the application → click "Log Interview." Pick the interviewer (must be on the job\'s Team), interview type (Phone Screen, Video Call, Technical, On-Site, etc.), location, and optionally a date and time. Once saved, the interviewer receives an email notification automatically with all the details and a link to their portal.',
      },
      {
        q: 'Can I schedule an interview without a confirmed time?',
        a: 'Yes — leave the date/time blank when logging it. The interview will show as "Time TBD" in the interviewer\'s portal. You can update it later by editing the interview event.',
      },
      {
        q: 'Where do I see the interviewer\'s evaluation?',
        a: 'Submitted scorecards appear on the application page under the Evaluations section. You\'ll see the overall rating, recommendation, and any notes the interviewer left per question.',
      },
      {
        q: 'How do I edit candidate info or upload a resume?',
        a: 'Open the application → click the edit icon next to the candidate\'s name, or use the "Upload Resume" button. Changes apply to the candidate\'s profile across all applications.',
      },
    ],
  },
  {
    id: 'inbox',
    icon: Inbox,
    title: 'Inbox & Messaging',
    items: [
      {
        q: 'How does the inbox work?',
        a: 'Each recruiter has their own private inbox — you only see conversations you started. If another recruiter messages the same candidate, those messages appear in their inbox, not yours. This keeps things from getting mixed up.',
      },
      {
        q: 'How do I send a message to a candidate?',
        a: 'From a candidate\'s profile or application page, click "Send Message." Enter a subject and body, then send. If Gmail is connected in Settings → Integrations, the message routes through your Gmail account. Otherwise it sends via SMTP.',
      },
      {
        q: 'How do I see the candidate\'s reply?',
        a: 'Open your inbox and find the conversation. Candidate replies appear on the left side (like an iMessage thread), your messages appear on the right. The app syncs replies automatically from Gmail every time you open a thread.',
      },
      {
        q: 'What are message templates?',
        a: 'Templates are pre-written messages you can reuse — great for interview invites, offer letters, or rejection emails. Go to Messages → Templates to create and manage them. When sending, pick a template to pre-fill the subject and body.',
      },
    ],
  },
  {
    id: 'interviewers',
    icon: UserCheck,
    title: 'Interviewers',
    items: [
      {
        q: 'How do I add someone as an interviewer?',
        a: 'Go to Interviewers in the sidebar → "Add Interviewer." Enter their name, email, and title. This creates their interviewer profile.',
      },
      {
        q: 'Do interviewers need a login?',
        a: 'Yes — go to Settings → Users → Send Invite. Enter the same email address you used for their Interviewer record and assign the Interviewer role. This links their login to their interview assignments.',
      },
      {
        q: 'What does an interviewer see when they log in?',
        a: 'Interviewers see a private portal — just their assigned interviews. They can view candidate details, read the resume, and submit their evaluation (scorecard). They have no access to the pipeline, jobs, settings, or other candidates.',
      },
      {
        q: 'How does an interviewer know they\'ve been assigned?',
        a: 'The moment you log an interview with them assigned, they automatically receive an email with the candidate\'s name, job title, interview type, time, location, and a direct link to their portal.',
      },
      {
        q: 'What if someone is both a hiring manager and an interviewer?',
        a: 'Give them the Hiring Manager role (for ATS access) and also create an Interviewer record with the same email (so they can be assigned to interviews). Both work independently.',
      },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings & Users',
    items: [
      {
        q: 'How do I invite someone to the system?',
        a: 'Settings → Users → "Send Invite." Enter their email and choose a role. They\'ll receive an invitation email with a link to set their password and log in.',
      },
      {
        q: 'What do the different roles mean?',
        a: 'Admin and Recruiter have full access to everything. Hiring Manager can see the pipeline, candidates, analytics, and their inbox — but not settings, templates, or interviewers. Interviewer only sees their own private interview portal.',
      },
      {
        q: 'How do I connect Gmail?',
        a: 'Settings → Integrations → Connect Gmail. Once connected, all messages you send from the ATS route through your Gmail account, and candidate replies sync back automatically.',
      },
      {
        q: 'Where do I update my name or password?',
        a: 'Settings → Profile. You can update your display name, email, and password from there.',
      },
    ],
  },
]

const HIRING_MANAGER_SECTIONS: HelpSection[] = [
  {
    id: 'access',
    icon: LayoutDashboard,
    title: 'Your Access',
    items: [
      {
        q: 'What can I see and do?',
        a: 'You have access to the Dashboard, Jobs, Candidates, Analytics, and your Inbox. You can view the full pipeline, read candidate profiles, and message candidates directly.',
      },
      {
        q: 'What do recruiters manage?',
        a: 'Recruiters handle inviting users, connecting integrations, managing message templates, adding interviewers, and adjusting settings. If you need something changed in those areas, reach out to your recruiter.',
      },
    ],
  },
  {
    id: 'pipeline',
    icon: GitBranch,
    title: 'Reviewing the Pipeline',
    items: [
      {
        q: 'How do I see where candidates stand?',
        a: 'Go to Jobs → click "Pipeline" on any open role. You\'ll see all candidates grouped by stage — Applied, Phone Screen, Interviewing, Offer, Hired, and Rejected.',
      },
      {
        q: 'How do I read a candidate\'s profile?',
        a: 'Click any candidate\'s name from the pipeline or the Candidates list. Their profile shows contact info, resume, application history, notes from the team, and any interview evaluations that have been submitted.',
      },
      {
        q: 'Where are the interview evaluations?',
        a: 'Open the application → scroll to the Evaluations section. You\'ll see each interviewer\'s rating, recommendation, and notes per question.',
      },
    ],
  },
  {
    id: 'inbox',
    icon: Inbox,
    title: 'Inbox & Messaging',
    items: [
      {
        q: 'How do I message a candidate?',
        a: 'Open any candidate\'s profile or application → click "Send Message." Write your subject and body and hit send. The candidate receives it as a regular email.',
      },
      {
        q: 'Where do I see their reply?',
        a: 'Go to Inbox in the sidebar. Your conversations are listed there. Open one to see the full thread — candidate messages appear on the left, yours on the right.',
      },
    ],
  },
]

/* ─────────────────────────────────────────────
   Accordion item
───────────────────────────────────────────── */

function AccordionItem({ item }: { item: HelpItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 py-4 text-left group"
      >
        <ChevronRight
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-90 text-[#0e7a5c]' : 'group-hover:text-gray-600'}`}
        />
        <span className={`text-sm font-medium leading-snug ${open ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
          {item.q}
        </span>
      </button>
      {open && (
        <div className="pb-4 pl-7 pr-2">
          <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Section card
───────────────────────────────────────────── */

function SectionCard({ section, defaultOpen = false }: { section: HelpSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = section.icon
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4AFFD2]/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#0e7a5c]" />
          </div>
          <span className="text-sm font-semibold text-gray-900">{section.title}</span>
          <span className="text-xs text-gray-400">{section.items.length} topic{section.items.length !== 1 ? 's' : ''}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 border-t border-gray-100">
          {section.items.map(item => (
            <AccordionItem key={item.q} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
}

const TIPS: Record<string, string[]> = {
  RECRUITER: [
    'Add interviewers to a job\'s Team tab before trying to schedule — they won\'t appear in the dropdown otherwise.',
    'Rejection dispositions are required. Pick the one that best describes why so your data stays clean.',
    'Each recruiter has their own inbox — messages don\'t mix between team members.',
    'Connect Gmail in Settings → Integrations to get two-way email sync with candidates.',
  ],
  ADMIN: [
    'Add interviewers to a job\'s Team tab before trying to schedule — they won\'t appear in the dropdown otherwise.',
    'Rejection dispositions are required. Pick the one that best describes why so your data stays clean.',
    'Each recruiter has their own inbox — messages don\'t mix between team members.',
    'Connect Gmail in Settings → Integrations to get two-way email sync with candidates.',
  ],
  HIRING_MANAGER: [
    'You can view every candidate\'s full profile and evaluation — just open their application.',
    'Your inbox is private — only conversations you started appear here.',
    'If you need to schedule an interview or change a pipeline stage, ask your recruiter.',
  ],
}

export function HelpClient({ role, userName }: { role: string; userName: string }) {
  const isRecruiter = role === 'RECRUITER' || role === 'ADMIN'
  const sections = isRecruiter ? RECRUITER_SECTIONS : HIRING_MANAGER_SECTIONS
  const tips = TIPS[role] ?? TIPS['RECRUITER']
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help Guide</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4AFFD2]/20 text-[#0e7a5c]">
            {roleLabel}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Hi {userName.split(' ')[0]} — this guide covers everything specific to your role. Click any section to expand it.
        </p>
      </div>

      {/* Quick tips */}
      <div className="card p-5 mb-6 bg-amber-50 border-amber-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <h2 className="text-sm font-semibold text-amber-800">Quick Tips</h2>
        </div>
        <ul className="space-y-2">
          {tips.map(tip => (
            <li key={tip} className="flex items-start gap-2 text-sm text-amber-800">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, i) => (
          <SectionCard key={section.id} section={section} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500">
          Something not covered here? Reach out to your admin or recruiter — they can walk you through anything in the system.
        </p>
      </div>
    </div>
  )
}
