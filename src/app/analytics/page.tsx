export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { STAGE_LABELS } from '@/lib/constants'
import { BarChart2, Clock, TrendingUp, Target, Users, Briefcase } from 'lucide-react'
import { ApplicationVolumeChart } from '@/components/analytics/ApplicationVolumeChart'
import { SourceBreakdownChart } from '@/components/analytics/SourceBreakdownChart'

function daysBetween(a: Date, b: Date) {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function pct(num: number, den: number) {
  if (den === 0) return '—'
  return `${Math.round((num / den) * 100)}%`
}

export default async function AnalyticsPage() {
  const now = new Date()
  const startOf30 = new Date(now); startOf30.setDate(now.getDate() - 30)
  const startOf60 = new Date(now); startOf60.setDate(now.getDate() - 60)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const start12Weeks = new Date(now); start12Weeks.setDate(now.getDate() - 84)

  const [
    allApplications,
    hiredApplications,
    recentApplications12w,
    offerAndHired,
    allJobs,
    allCandidates,
    stageBreakdown,
  ] = await Promise.all([
    // All applications with job + candidate
    prisma.application.findMany({
      include: { job: { select: { id: true, title: true, createdAt: true, status: true, hiringGoal: true } }, candidate: { select: { source: true } } },
    }),
    // Hired applications with job info for TTF calc
    prisma.application.findMany({
      where: { stage: 'HIRED', hiredAt: { not: null } },
      select: { hiredAt: true, createdAt: true, job: { select: { createdAt: true, title: true, id: true } } },
    }),
    // Last 12 weeks for volume chart
    prisma.application.findMany({
      where: { createdAt: { gte: start12Weeks } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // Offer + Hired for acceptance rate
    prisma.application.count({ where: { stage: { in: ['OFFER', 'HIRED'] } } }),
    // Jobs with application counts
    prisma.job.findMany({
      include: {
        _count: { select: { applications: true } },
        applications: { select: { stage: true, hiredAt: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.candidate.findMany({ select: { source: true, createdAt: true } }),
    prisma.application.groupBy({ by: ['stage'], _count: { stage: true } }),
  ])

  // ── Metric calculations ──────────────────────────────────────────────────

  const totalHired = hiredApplications.length
  const offerAcceptanceRate = pct(totalHired, offerAndHired)

  // Average time to fill (job.createdAt → hiredAt)
  const ttfDays = hiredApplications
    .filter(a => a.hiredAt)
    .map(a => daysBetween(a.job.createdAt, a.hiredAt!))
  const avgTTF = ttfDays.length > 0 ? Math.round(ttfDays.reduce((s, d) => s + d, 0) / ttfDays.length) : null

  // Applications this month vs last month
  const appsThisMonth = allApplications.filter(a => a.createdAt >= startOfMonth).length
  const appsLastMonth = allApplications.filter(a => a.createdAt >= startOfLastMonth && a.createdAt <= endOfLastMonth).length
  const appMoM = appsLastMonth > 0 ? Math.round(((appsThisMonth - appsLastMonth) / appsLastMonth) * 100) : null

  // ── Application volume by week (last 12 weeks) ──────────────────────────
  const weekBuckets: { week: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - i * 7 - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const count = recentApplications12w.filter(a => a.createdAt >= weekStart && a.createdAt < weekEnd).length
    weekBuckets.push({ week: label, count })
  }

  // ── Source breakdown ────────────────────────────────────────────────────
  const sourceMap: Record<string, number> = {}
  allApplications.forEach(a => {
    const src = a.candidate.source ?? 'Unknown'
    sourceMap[src] = (sourceMap[src] ?? 0) + 1
  })
  const sourceData = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // ── Stage breakdown ─────────────────────────────────────────────────────
  const stageMap = Object.fromEntries(stageBreakdown.map(s => [s.stage, s._count.stage]))
  const funnelStages = ['APPLIED', 'PHONE_SCREEN', 'ONSITE', 'OFFER', 'HIRED'] as const
  const topCount = stageMap['APPLIED'] ?? 1

  // ── Per-job performance table ───────────────────────────────────────────
  const jobRows = allJobs.map(job => {
    const apps = job.applications
    const hired = apps.filter(a => a.stage === 'HIRED')
    const inProgress = apps.filter(a => !['HIRED', 'REJECTED'].includes(a.stage)).length
    const rejected = apps.filter(a => a.stage === 'REJECTED').length
    const jobTTF = hired.filter(a => a.hiredAt).map(a => daysBetween(job.createdAt, a.hiredAt!))
    const avgJobTTF = jobTTF.length > 0 ? Math.round(jobTTF.reduce((s, d) => s + d, 0) / jobTTF.length) : null
    return {
      id: job.id, title: job.title, status: job.status,
      total: apps.length, inProgress, hired: hired.length,
      rejected, goal: job.hiringGoal, avgTTF: avgJobTTF,
    }
  })

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#4AFFD2]/20 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-[#111]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hiring performance and pipeline metrics</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Time to Fill</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{avgTTF != null ? `${avgTTF}d` : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">from req open → hire</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2"><Clock className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Apps This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{appsThisMonth}</p>
              <p className={`text-xs mt-1 font-medium ${appMoM == null ? 'text-gray-400' : appMoM >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {appMoM == null ? 'no prior data' : `${appMoM >= 0 ? '+' : ''}${appMoM}% vs last month`}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Offer Acceptance</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{offerAcceptanceRate}</p>
              <p className="text-xs text-gray-400 mt-1">{totalHired} hired of {offerAndHired} reached offer</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2"><Target className="w-5 h-5 text-green-600" /></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Hired</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalHired}</p>
              <p className="text-xs text-gray-400 mt-1">all time</p>
            </div>
            <div className="bg-[#4AFFD2]/20 rounded-lg p-2"><Users className="w-5 h-5 text-[#111]" /></div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Application volume */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Application Volume</h2>
            <p className="text-xs text-gray-400 mt-0.5">Weekly — last 12 weeks</p>
          </div>
          <div className="p-4">
            <ApplicationVolumeChart data={weekBuckets} />
          </div>
        </div>

        {/* Source breakdown */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Source of Hire</h2>
            <p className="text-xs text-gray-400 mt-0.5">Where candidates come from</p>
          </div>
          <div className="p-4">
            <SourceBreakdownChart data={sourceData} />
          </div>
        </div>
      </div>

      {/* Pipeline funnel */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pipeline Funnel</h2>
            <p className="text-xs text-gray-400 mt-0.5">All active applications</p>
          </div>
          <div className="p-6 space-y-3">
            {funnelStages.map(stage => {
              const count = stageMap[stage] ?? 0
              const widthPct = Math.round((count / topCount) * 100)
              const colors: Record<string, string> = {
                APPLIED: 'bg-gray-400', PHONE_SCREEN: 'bg-blue-400',
                ONSITE: 'bg-purple-400', OFFER: 'bg-yellow-400', HIRED: 'bg-[#4AFFD2]',
              }
              return (
                <div key={stage}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{STAGE_LABELS[stage]}</span>
                    <span className="text-sm text-gray-500 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[stage]} rounded-full`} style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              )
            })}
            {(stageMap['REJECTED'] ?? 0) > 0 && (
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm text-gray-400">
                <span>Rejected</span><span>{stageMap['REJECTED']}</span>
              </div>
            )}
          </div>
        </div>

        {/* Per-job table */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Performance by Role</h2>
            <p className="text-xs text-gray-400 mt-0.5">Applications, pipeline, and time to fill per job</p>
          </div>
          {jobRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No jobs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hired</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Goal</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg TTF</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobRows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 max-w-[200px] truncate">{row.title}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.total}</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-medium">{row.inProgress}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{row.hired}</td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {row.goal ? (
                          <span className={row.hired >= row.goal ? 'text-green-600 font-semibold' : ''}>
                            {row.hired}/{row.goal}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {row.avgTTF != null ? `${row.avgTTF}d` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                          row.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                          row.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'
                        }`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
