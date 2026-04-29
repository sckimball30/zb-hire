export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MapPin, Briefcase, DollarSign, ArrowRight } from 'lucide-react'

type Job = {
  id: string
  title: string
  department: string | null
  location: string | null
  employmentType: string | null
  payType: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
}

function formatComp(job: Job): string | null {
  if (!job.salaryMin && !job.salaryMax) return null
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salaryCurrency || 'USD',
      maximumFractionDigits: 0,
    }).format(n)
  const range =
    job.salaryMin && job.salaryMax
      ? `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
      : job.salaryMin
      ? `From ${fmt(job.salaryMin)}`
      : `Up to ${fmt(job.salaryMax!)}`
  const suffix = job.payType === 'HOURLY' ? '/hr' : '/yr'
  return range + suffix
}

export default async function CareersPage() {
  const [jobs, settings] = await Promise.all([
    prisma.job.findMany({
      where: { status: 'OPEN' },
      select: {
        id: true,
        title: true,
        department: true,
        location: true,
        employmentType: true,
        payType: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
      },
      orderBy: [{ department: 'asc' }, { title: 'asc' }],
    }),
    prisma.companySettings.findUnique({ where: { id: 'singleton' } }),
  ])

  // Group jobs by department
  const departments: Record<string, Job[]> = {}
  for (const job of jobs) {
    const dept = job.department || 'Open Roles'
    if (!departments[dept]) departments[dept] = []
    departments[dept].push(job)
  }

  const headline  = settings?.heroHeadline || 'Come Build With Us'
  const tagline   = settings?.heroTagline  || "We're looking for creative, driven people to join our team."
  const heroImage = settings?.careersHeroImageUrl
  const multiDept = Object.keys(departments).length > 1

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white py-6 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/wigglitz-logo.png"
            alt="Wigglitz"
            className="h-16 sm:h-20 w-auto object-contain"
          />
          <p className="text-gray-400 text-xs font-medium tracking-widest uppercase">Careers</p>
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-1.5 flex">
        <div className="flex-1 bg-[#4AFFD2]" />
        <div className="flex-1 bg-[#F26D77]" />
        <div className="flex-1 bg-[#F5D020]" />
        <div className="flex-1 bg-[#3AADE0]" />
        <div className="flex-1 bg-[#4AFFD2]" />
      </div>

      {/* Hero */}
      <div
        className="relative bg-[#111111] text-white"
        style={
          heroImage
            ? { backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}
        }
      >
        {heroImage && <div className="absolute inset-0 bg-black/55" />}
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4 tracking-tight">
            {headline}
          </h1>
          <p className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            {tagline}
          </p>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4AFFD2]/20 border border-[#4AFFD2]/30 text-[#4AFFD2] text-sm font-semibold">
            {jobs.length} Open Position{jobs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Job listings */}
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        {jobs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-700 text-lg font-semibold">No open positions right now</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon — we're always growing!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(departments).map(([dept, deptJobs]) => (
              <div key={dept}>
                {multiDept && (
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {dept}
                    </h2>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {deptJobs.length} role{deptJobs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptJobs.map(job => {
                    const comp = formatComp(job)
                    return (
                      <Link
                        key={job.id}
                        href={`/apply/${job.id}`}
                        className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-[#4AFFD2] hover:shadow-md transition-all flex flex-col gap-4"
                      >
                        <div className="flex-1">
                          {job.department && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4AFFD2]/15 text-[#1a9e82] uppercase tracking-wide mb-2">
                              {job.department}
                            </span>
                          )}
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1a9e82] leading-snug transition-colors">
                            {job.title}
                          </h3>

                          <div className="mt-3 flex flex-col gap-1.5">
                            {job.location && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                {job.location}
                              </span>
                            )}
                            {job.employmentType && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                {EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}
                              </span>
                            )}
                            {comp && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                {comp}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-sm font-semibold text-[#1a9e82] border-t border-gray-100 pt-3">
                          View Role
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 py-8 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-gray-500">ZB Designs</span>
        </p>
      </div>
    </div>
  )
}
