import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { JobTabNav } from '@/components/jobs/JobTabNav'

export default async function JobLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { jobId: string }
}) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: { id: true, title: true, department: true, status: true },
  })
  if (!job) notFound()

  return (
    <div className="flex flex-col h-full">
      {/* Job header */}
      <div className="px-8 pt-6 pb-0 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/jobs" className="hover:text-gray-700">Jobs</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{job.title}</span>
        </div>
        <div className="flex items-center justify-between mb-0">
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
        </div>
        <JobTabNav jobId={job.id} />
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
