export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Briefcase, Users, TrendingUp, Clock, CheckCircle, Inbox } from 'lucide-react'
import { formatDate, timeAgo, initials, stripEmailQuote, isNewApplicant } from '@/lib/utils'
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/constants'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [
    totalJobs,
    openJobs,
    activeApplications,
    hiredThisMonth,
    newThisMonth,
    recentApplications,
    stageBreakdown,
    recentActivity,
    myOutboundCandidateIds,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: 'OPEN' } }),
    // Active = anything not rejected or hired
    prisma.application.count({
      where: { stage: { notIn: ['REJECTED', 'HIRED'] } },
    }),
    prisma.application.count({
      where: {
        stage: 'HIRED',
        hiredAt: { gte: monthStart },
      },
    }),
    // New applications this month
    prisma.application.count({
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { candidate: true, job: true },
    }),
    prisma.application.groupBy({
      by: ['stage'],
      _count: { stage: true },
    }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { application: { include: { candidate: true, job: true } } },
    }),
    // Inbox: candidate IDs this user has messaged
    userId
      ? prisma.messageLog.findMany({
          where: { sentById: userId, direction: 'OUTBOUND' },
          select: { candidateId: true },
          distinct: ['candidateId'],
        })
      : Promise.resolve([]),
  ])

  const stageMap = Object.fromEntries(stageBreakdown.map(s => [s.stage, s._count.stage]))

  // Build inbox preview — latest message per candidate, up to 4 conversations
  const myCandidateIds = myOutboundCandidateIds.map((l: any) => l.candidateId)
  const inboxLogs = myCandidateIds.length > 0
    ? await prisma.messageLog.findMany({
        where: { candidateId: { in: myCandidateIds } },
        orderBy: { sentAt: 'desc' },
        include: { candidate: { select: { id: true, firstName: true, lastName: true } } },
      })
    : []
  const seenInbox = new Set<string>()
  const inboxPreview: { candidateId: string; candidate: { id: string; firstName: string; lastName: string }; body: string; sentAt: Date; direction: string; unread: number }[] = []
  for (const log of inboxLogs) {
    if (!seenInbox.has(log.candidateId)) {
      seenInbox.add(log.candidateId)
      const unread = inboxLogs.filter(l => l.candidateId === log.candidateId && l.direction === 'INBOUND' && !l.read).length
      inboxPreview.push({ candidateId: log.candidateId, candidate: log.candidate, body: log.body, sentAt: log.sentAt, direction: log.direction, unread })
      if (inboxPreview.length === 4) break
    }
  }
  const totalInboxUnread = inboxPreview.reduce((s, c) => s + c.unread, 0)

  const funnelStages = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEWING', 'ONSITE', 'OFFER', 'HIRED'] as const
  // Use the largest stage count as the 100% baseline so bars never exceed full width
  const funnelCounts = funnelStages.map(s => stageMap[s] ?? 0)
  const totalTop = Math.max(...funnelCounts, 1)

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your hiring pipeline at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Open Roles', value: openJobs, sub: `${totalJobs} total`, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active in Pipeline', value: activeApplications, sub: 'not hired or rejected', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'New This Month', value: newThisMonth, sub: new Date().toLocaleString('default', { month: 'long' }), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Hired This Month', value: hiredThisMonth, sub: new Date().toLocaleString('default', { month: 'long' }), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">{sub}</p>
              </div>
              <div className={`${bg} rounded-lg p-1.5 sm:p-2`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Hiring Funnel */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Hiring Funnel</h2>
          </div>
          <div className="p-6 space-y-3">
            {funnelStages.map((stage, i) => {
              const count = funnelCounts[i]
              const pct = Math.round((count / totalTop) * 100)
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{STAGE_LABELS[stage]}</span>
                    <span className="text-sm text-gray-500">{count} candidates</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {stageMap['REJECTED'] != null && (
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm text-gray-500">
                <span>Rejected</span>
                <span>{stageMap['REJECTED']}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {recentActivity.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-400 text-center">No activity yet.</li>
            )}
            {recentActivity.map(log => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{log.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {log.application.candidate.firstName} {log.application.candidate.lastName} · {timeAgo(log.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Inbox Preview */}
      <div className="card overflow-hidden mt-4 md:mt-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Inbox</h2>
            {totalInboxUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {totalInboxUnread}
              </span>
            )}
          </div>
          <Link href="/inbox" className="text-sm text-blue-600 hover:underline">Open inbox</Link>
        </div>
        {inboxPreview.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No messages yet. Send a message from any candidate profile.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {inboxPreview.map(conv => (
              <li key={conv.candidateId}>
                <Link
                  href="/inbox"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${conv.unread > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {initials(conv.candidate.firstName, conv.candidate.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {conv.candidate.firstName} {conv.candidate.lastName}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(conv.sentAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.direction === 'OUTBOUND' ? 'You: ' : ''}
                      {stripEmailQuote(conv.body).slice(0, 70)}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {conv.unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Applications */}
      <div className="card overflow-hidden mt-4 md:mt-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Applications</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">View all jobs</Link>
        </div>
        {recentApplications.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">No applications yet.</div>
        ) : (
          <>
            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-gray-50">
              {recentApplications.map(app => (
                <li key={app.id}>
                  <Link
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {initials(app.candidate.firstName, app.candidate.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {app.candidate.firstName} {app.candidate.lastName}
                        </span>
                        {isNewApplicant(app.createdAt) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide flex-shrink-0">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{app.job.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
                        {STAGE_LABELS[app.stage]}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(app.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Stage</th>
                    <th>Applied</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map(app => (
                    <tr key={app.id}>
                      <td className="font-medium text-gray-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          {app.candidate.firstName} {app.candidate.lastName}
                          {isNewApplicant(app.createdAt) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-gray-600">{app.job.title}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
                          {STAGE_LABELS[app.stage]}
                        </span>
                      </td>
                      <td className="text-gray-500 text-sm">{formatDate(app.createdAt)}</td>
                      <td>
                        <Link href={`/applications/${app.id}`} className="text-blue-600 hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
