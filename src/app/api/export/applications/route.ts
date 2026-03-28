import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function escapeCsv(value: string | null | undefined) {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(cols: (string | null | undefined)[]) {
  return cols.map(escapeCsv).join(',')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  const applications = await prisma.application.findMany({
    where: jobId ? { jobId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      candidate: true,
      job: true,
      scorecards: { include: { interviewer: true } },
    },
  })

  const headers = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Source',
    'Job Title', 'Department', 'Stage', 'Star Rating',
    'Scorecards', 'Applied At', 'Hired At', 'Rejected At',
  ]
  const lines: string[] = [headers.join(',')]

  for (const a of applications) {
    const scorecardSummary = a.scorecards
      .map(s => `${s.interviewer.name}: ${s.overallRating ?? 'Pending'}`)
      .join(' | ')
    lines.push(row([
      a.candidate.firstName,
      a.candidate.lastName,
      a.candidate.email,
      a.candidate.phone,
      a.candidate.source,
      a.job.title,
      a.job.department,
      a.stage,
      a.starRating?.toString(),
      scorecardSummary,
      a.createdAt.toISOString(),
      a.hiredAt?.toISOString(),
      a.rejectedAt?.toISOString(),
    ]))
  }

  const csv = lines.join('\n')
  const label = jobId ? `job-${jobId}` : 'all-jobs'
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="applications-${label}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
