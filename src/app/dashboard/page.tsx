export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Briefcase, Users, UserCheck, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/constants'

export default async function DashboardPage() {
  const [
    totalJobs,
    openJobs,
    totalCandidates,
    totalApplications,
    hiredThisMonth,
    recentApplications,
    stageBreakdown,
    recentActivity,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: 'OPEN' } }),
    prisma.candidate.count(),
    prisma.application.count(),
    prisma.application.count({
      where: {
        stage: 'HIRED',
        hiredAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
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
  ])

  const stageMap = Object.fromEntries(stageBreakdown.map(s => [s.stage, s._count.stage]))

  const funnelStages = ['APPLIED', 'PHONE_SCREEN', 'ONSITE', 'OFFER', 'HIRED'] as const
  const totalTop = stageMap['APPLIED'] ?? 0

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your hiring pipeline at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open Roles', value: openJobs, sub: `${totalJobs} total`, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Candidates', value: totalCandidates, sub: 'all time', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Applications', value: totalApplications, sub: 'across all roles', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Hired This Month', value: hiredThisMonth, sub: new Date().toLocaleString('default', { month: 'long' }), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
              <div className={`${bg} rounded-lg p-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Hiring Funnel */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Hiring Funnel</h2>
          </div>
          <div className="p-6 space-y-3">
            {funnelStages.map(stage => {
              const count = stageMap[stage] ?? 0
              const pct = totalTop > 0 ? Math.round((count / totalTop) * 100) : 0
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

      {/* Recent Applications */}
      <div className="card overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Applications</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">View all jobs</Link>
        </div>
        {recentApplications.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">No applications yet.</div>
        ) : (
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
                    {app.candidate.firstName} {app.candidate.lastName}
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
        )}
      </div>
    </div>
  )
}
