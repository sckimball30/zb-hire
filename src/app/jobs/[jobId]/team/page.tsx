export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TeamManager } from '@/components/jobs/TeamManager'
import { InterviewRoundsManager } from '@/components/jobs/InterviewRoundsManager'
import { RecruiterManager } from '@/components/jobs/RecruiterManager'

export default async function JobTeamPage({
  params,
}: {
  params: { jobId: string }
}) {
  const [job, allInterviewers, allRecruiters] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        interviewers: {
          include: { interviewer: true },
          orderBy: { assignedAt: 'asc' },
        },
        recruiters: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
        },
        rounds: {
          include: {
            interviewers: {
              include: { interviewer: true },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    }),
    prisma.interviewer.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'RECRUITER'] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!job) notFound()

  const assignedIds = new Set(job.interviewers.map((ji) => ji.interviewerId))
  const availableInterviewers = allInterviewers.filter((i) => !assignedIds.has(i.id))

  const initialRounds = job.rounds.map(r => ({
    id: r.id,
    name: r.name,
    roundNumber: r.roundNumber,
    duration: r.duration,
    interviewers: r.interviewers.map(ri => ({
      interviewerId: ri.interviewerId,
      interviewer: ri.interviewer,
    })),
  }))

  return (
    <div className="p-8 max-w-4xl space-y-8">
      {/* Recruiters section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruiters</h2>
        <RecruiterManager
          jobId={job.id}
          currentRecruiters={job.recruiters}
          allRecruiters={allRecruiters}
        />
      </div>

      {/* Interview team section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Team</h2>
        <TeamManager
          jobId={job.id}
          currentTeam={job.interviewers}
          availableInterviewers={availableInterviewers}
        />
      </div>

      {/* Interview rounds section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Rounds</h2>
        <InterviewRoundsManager
          jobId={job.id}
          initialRounds={initialRounds}
          allInterviewers={allInterviewers}
        />
      </div>
    </div>
  )
}
