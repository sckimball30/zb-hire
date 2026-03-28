import { NextResponse } from 'next/server'
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

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      applications: { include: { job: true } },
    },
  })

  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'LinkedIn', 'Source', 'Applied Roles', 'Current Stages', 'Created At']
  const lines: string[] = [headers.join(',')]

  for (const c of candidates) {
    const roles = c.applications.map(a => a.job.title).join(' | ')
    const stages = c.applications.map(a => a.stage).join(' | ')
    lines.push(row([c.firstName, c.lastName, c.email, c.phone, c.linkedInUrl, c.source, roles, stages, c.createdAt.toISOString()]))
  }

  const csv = lines.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="candidates-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
