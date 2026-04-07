export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KickoffForm } from '@/components/jobs/KickoffForm'

export default async function JobKickoffPage({ params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true,
      kickoff: true,
    },
  })

  if (!job) notFound()

  const kickoff = job.kickoff
    ? {
        ...job.kickoff,
        targetStartDate: job.kickoff.targetStartDate?.toISOString() ?? undefined,
        completedAt: job.kickoff.completedAt?.toISOString() ?? undefined,
      }
    : {}

  return (
    <KickoffForm
      jobId={job.id}
      jobTitle={job.title}
      initialData={kickoff}
      salaryMin={job.salaryMin}
      salaryMax={job.salaryMax}
    />
  )
}
