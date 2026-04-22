/**
 * Public read-only ATS snapshot for Claude Desktop web browsing.
 *
 * Usage: paste this URL into any Claude conversation:
 *   https://<your-domain>/api/claude/snapshot?key=<CLAUDE_SNAPSHOT_KEY>
 *
 * Claude will browse to it and get a full plain-text summary of your ATS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const key = process.env.CLAUDE_SNAPSHOT_KEY
  if (!key) return false
  return req.nextUrl.searchParams.get('key') === key
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const [jobs, applications, candidates, templates, recentMessages] = await Promise.all([
    prisma.job.findMany({
      include: {
        _count: { select: { applications: true } },
        hiringManager: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.groupBy({
      by: ['stage'],
      _count: { _all: true },
    }),
    prisma.candidate.findMany({
      include: {
        applications: {
          include: { job: { select: { title: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.messageTemplate.findMany({ orderBy: { name: 'asc' } }),
    prisma.messageLog.findMany({
      where: { direction: 'INBOUND', read: false },
      include: { candidate: { select: { firstName: true, lastName: true } } },
      orderBy: { sentAt: 'desc' },
      take: 10,
    }),
  ])

  const openJobs   = jobs.filter(j => j.status === 'OPEN')
  const closedJobs = jobs.filter(j => j.status === 'CLOSED')
  const draftJobs  = jobs.filter(j => j.status === 'DRAFT')

  const stageOrder = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']
  const stageCounts = Object.fromEntries(applications.map(a => [a.stage, a._count._all]))
  const totalApps   = Object.values(stageCounts).reduce((a, b) => a + b, 0)

  const lines: string[] = []

  lines.push(`# ZB Hire ATS Snapshot`)
  lines.push(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })} MT`)
  lines.push(``)

  // ── Overview ────────────────────────────────────────────────────────────────
  lines.push(`## Overview`)
  lines.push(`- Open jobs: ${openJobs.length}`)
  lines.push(`- Draft jobs: ${draftJobs.length}`)
  lines.push(`- Closed jobs: ${closedJobs.length}`)
  lines.push(`- Total candidates: ${candidates.length}+ (showing most recent 30)`)
  lines.push(`- Total active applications: ${totalApps}`)
  lines.push(`- Unread candidate replies: ${recentMessages.length}`)
  lines.push(`- Message templates: ${templates.length}`)
  lines.push(``)

  // ── Pipeline Funnel ──────────────────────────────────────────────────────────
  lines.push(`## Pipeline Funnel (all jobs)`)
  for (const stage of stageOrder) {
    const count = stageCounts[stage] ?? 0
    const pct   = totalApps ? Math.round((count / totalApps) * 100) : 0
    const bar   = '█'.repeat(Math.round(pct / 5))
    lines.push(`- ${stage.replace('_', ' ')}: ${count} (${pct}%) ${bar}`)
  }
  lines.push(``)

  // ── Open Jobs ───────────────────────────────────────────────────────────────
  lines.push(`## Open Jobs`)
  if (openJobs.length === 0) {
    lines.push(`No open jobs.`)
  } else {
    for (const job of openJobs) {
      lines.push(`### ${job.title}`)
      if (job.department) lines.push(`Department: ${job.department}`)
      if (job.location)   lines.push(`Location: ${job.location}`)
      lines.push(`Applicants: ${job._count.applications}`)
      if (job.hiringManager) lines.push(`Hiring Manager: ${job.hiringManager.name}`)
      lines.push(``)
    }
  }

  // ── Recent Candidates ───────────────────────────────────────────────────────
  lines.push(`## Recent Candidates (last 30)`)
  for (const c of candidates) {
    const app = c.applications[0]
    const tags = c.tags.map(t => t.tag.name).join(', ')
    lines.push(`- **${c.firstName} ${c.lastName}** — ${c.email}${app ? ` | ${app.job.title} (${app.stage})` : ' | No application'}${tags ? ` | Tags: ${tags}` : ''}${(c as any).blocked ? ' | ⛔ DO NOT CONTACT' : ''}`)
  }
  lines.push(``)

  // ── Unread Replies ──────────────────────────────────────────────────────────
  if (recentMessages.length > 0) {
    lines.push(`## Unread Candidate Replies`)
    for (const msg of recentMessages) {
      lines.push(`- **${msg.candidate.firstName} ${msg.candidate.lastName}**: "${msg.subject}" — ${new Date(msg.sentAt).toLocaleDateString()}`)
    }
    lines.push(``)
  }

  // ── Message Templates ───────────────────────────────────────────────────────
  lines.push(`## Message Templates`)
  for (const t of templates) {
    lines.push(`### ${t.name}`)
    lines.push(`**Subject:** ${t.subject}`)
    lines.push(`**Body:**`)
    lines.push(t.body)
    lines.push(``)
  }

  // ── Draft Jobs ──────────────────────────────────────────────────────────────
  if (draftJobs.length > 0) {
    lines.push(`## Draft Jobs`)
    for (const job of draftJobs) {
      lines.push(`- ${job.title}${job.department ? ` (${job.department})` : ''}`)
    }
    lines.push(``)
  }

  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
