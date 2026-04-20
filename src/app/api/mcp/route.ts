/**
 * MCP (Model Context Protocol) endpoint for Claude Chat integration.
 *
 * Claude.ai → Settings → Integrations → Add MCP Server
 *   URL:  https://<your-domain>/api/mcp
 *   Auth: Bearer <CLAUDE_MCP_API_KEY>   (or X-Api-Key header)
 *
 * Implements the Streamable HTTP transport (JSON-RPC 2.0).
 * Supports: initialize · tools/list · tools/call
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ─── JSON-RPC helpers ─────────────────────────────────────────────────────────

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status: 400 })
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function authorized(req: NextRequest): boolean {
  const key = process.env.CLAUDE_MCP_API_KEY
  if (!key) return false
  const auth = req.headers.get('authorization') ?? ''
  const xkey = req.headers.get('x-api-key') ?? ''
  return auth === `Bearer ${key}` || xkey === key
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_overview',
    description: 'Get a high-level overview of the ATS — open jobs, total candidates, pipeline stage counts, and recent activity. Use this first to understand the current state of the hiring pipeline.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_jobs',
    description: 'List all jobs with their status, department, application counts, and hiring manager. Useful for understanding what roles are open or closed.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['OPEN', 'CLOSED', 'DRAFT'], description: 'Filter by job status (default: all)' },
      },
      required: [],
    },
  },
  {
    name: 'get_job_pipeline',
    description: "Get the full candidate pipeline for a specific job, grouped by stage (Applied, Phone Screen, Interview, Offer, Hired, Rejected). Shows each candidate's name, stage, and latest activity.",
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'The job ID (get it from list_jobs)' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'list_candidates',
    description: 'List candidates with optional search. Returns name, email, current stage, applied jobs, and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by name or email (optional)' },
        limit: { type: 'number', description: 'Max results (default 20, max 100)' },
      },
      required: [],
    },
  },
  {
    name: 'get_candidate',
    description: 'Get full details for a candidate — contact info, all applications, interview history, evaluation scores, message history, and notes.',
    inputSchema: {
      type: 'object',
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID' },
      },
      required: ['candidateId'],
    },
  },
  {
    name: 'list_templates',
    description: 'List all message templates. Each template has a name, subject line, and body with {{variable}} placeholders. Use this to review existing templates before creating new ones.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_template',
    description: 'Get the full content of a specific message template.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID (from list_templates)' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'create_template',
    description: 'Create a new message template. Supports {{firstName}}, {{jobTitle}}, {{recruiterName}}, {{Interviewer Name}}, {{Interviewer Title}}, {{Calendly Link}}, {{Careers Page URL}} as variables.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name (shown in dropdown)' },
        subject: { type: 'string', description: 'Email subject line (can use {{variables}})' },
        body: { type: 'string', description: 'Email body (can use {{variables}}, use \\n for line breaks)' },
      },
      required: ['name', 'subject', 'body'],
    },
  },
  {
    name: 'update_template',
    description: 'Update an existing message template.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID to update' },
        name: { type: 'string', description: 'New name (optional)' },
        subject: { type: 'string', description: 'New subject (optional)' },
        body: { type: 'string', description: 'New body (optional)' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'delete_template',
    description: 'Delete a message template by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID to delete' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'get_pipeline_stats',
    description: 'Get funnel statistics — how many candidates are at each stage, conversion rates between stages, and average time per stage. Useful for identifying bottlenecks.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Scope to a specific job (optional — omit for system-wide stats)' },
      },
      required: [],
    },
  },
  {
    name: 'list_message_logs',
    description: 'Get the message history for a candidate — both outbound messages sent by your team and inbound replies from the candidate.',
    inputSchema: {
      type: 'object',
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID' },
        limit: { type: 'number', description: 'Max messages to return (default 20)' },
      },
      required: ['candidateId'],
    },
  },
]

// ─── Tool handlers ─────────────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    // ── get_overview ──────────────────────────────────────────────────────────
    case 'get_overview': {
      const [jobCount, candidateCount, appsByStage, recentApps] = await Promise.all([
        prisma.job.count({ where: { status: 'OPEN' } }),
        prisma.candidate.count(),
        prisma.application.groupBy({ by: ['stage'], _count: { _all: true } }),
        prisma.application.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          include: { candidate: { select: { firstName: true, lastName: true } }, job: { select: { title: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])
      return JSON.stringify({
        openJobs: jobCount,
        totalCandidates: candidateCount,
        pipelineStageCounts: Object.fromEntries(appsByStage.map(s => [s.stage, s._count._all])),
        recentApplications: recentApps.map(a => ({
          candidate: `${a.candidate.firstName} ${a.candidate.lastName}`,
          job: a.job.title,
          stage: a.stage,
          appliedAt: a.createdAt,
        })),
      }, null, 2)
    }

    // ── list_jobs ─────────────────────────────────────────────────────────────
    case 'list_jobs': {
      const where = args.status ? { status: args.status } : {}
      const jobs = await prisma.job.findMany({
        where,
        include: {
          _count: { select: { applications: true } },
          hiringManager: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return JSON.stringify(jobs.map(j => ({
        id: j.id,
        title: j.title,
        department: j.department,
        status: j.status,
        location: j.location,
        applicantCount: j._count.applications,
        hiringManager: j.hiringManager ? `${j.hiringManager.name} (${j.hiringManager.email})` : null,
        createdAt: j.createdAt,
      })), null, 2)
    }

    // ── get_job_pipeline ──────────────────────────────────────────────────────
    case 'get_job_pipeline': {
      if (!args.jobId) throw new Error('jobId is required')
      const job = await prisma.job.findUnique({ where: { id: args.jobId }, select: { title: true } })
      if (!job) throw new Error('Job not found')
      const apps = await prisma.application.findMany({
        where: { jobId: args.jobId },
        include: {
          candidate: { select: { firstName: true, lastName: true, email: true } },
          events: { select: { scheduledAt: true, type: true }, orderBy: { scheduledAt: 'desc' }, take: 1 },
          hireDecisions: { select: { recommendation: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { stageOrder: 'asc' },
      })
      const byStage: Record<string, any[]> = {}
      for (const app of apps) {
        if (!byStage[app.stage]) byStage[app.stage] = []
        byStage[app.stage].push({
          applicationId: app.id,
          candidate: `${app.candidate.firstName} ${app.candidate.lastName}`,
          email: app.candidate.email,
          lastInterview: app.events[0]?.scheduledAt ?? null,
          hireRecommendation: app.hireDecisions[0]?.recommendation ?? null,
        })
      }
      return JSON.stringify({ job: job.title, pipeline: byStage }, null, 2)
    }

    // ── list_candidates ───────────────────────────────────────────────────────
    case 'list_candidates': {
      const limit = Math.min(args.limit ?? 20, 100)
      const where = args.search ? {
        OR: [
          { firstName: { contains: args.search, mode: 'insensitive' as const } },
          { lastName:  { contains: args.search, mode: 'insensitive' as const } },
          { email:     { contains: args.search, mode: 'insensitive' as const } },
        ],
      } : {}
      const candidates = await prisma.candidate.findMany({
        where,
        include: {
          applications: { include: { job: { select: { title: true } } }, orderBy: { createdAt: 'desc' } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return JSON.stringify(candidates.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        blocked: c.blocked,
        jobs: c.applications.map(a => ({ title: a.job.title, stage: a.stage })),
        tags: c.tags.map(t => t.tag.name),
        addedAt: c.createdAt,
      })), null, 2)
    }

    // ── get_candidate ─────────────────────────────────────────────────────────
    case 'get_candidate': {
      if (!args.candidateId) throw new Error('candidateId is required')
      const c = await prisma.candidate.findUnique({
        where: { id: args.candidateId },
        include: {
          applications: {
            include: {
              job: { select: { title: true } },
              events: { include: { interviewer: { select: { name: true } } }, orderBy: { scheduledAt: 'desc' } },
              scorecardEntries: { where: { status: 'SUBMITTED' } },
              hireDecisions: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
          },
          candidateNotes: { orderBy: { createdAt: 'desc' } },
          messageLogs: { orderBy: { sentAt: 'desc' }, take: 5 },
          tags: { include: { tag: true } },
        },
      })
      if (!c) throw new Error('Candidate not found')
      return JSON.stringify({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        linkedIn: c.linkedInUrl,
        source: c.source,
        notes: c.notes,
        blocked: c.blocked,
        tags: c.tags.map(t => t.tag.name),
        applications: c.applications.map(a => ({
          applicationId: a.id,
          job: a.job.title,
          stage: a.stage,
          interviews: a.events.map(e => ({
            type: e.type,
            interviewer: e.interviewer.name,
            scheduledAt: e.scheduledAt,
          })),
          evaluations: a.scorecardEntries.length,
          hireDecision: a.hireDecisions[0]?.recommendation ?? null,
        })),
        recentMessages: c.messageLogs.map(m => ({
          direction: m.direction,
          subject: m.subject,
          sentAt: m.sentAt,
          sentBy: m.sentByName,
        })),
        internalNotes: c.candidateNotes.map(n => ({ note: n.content, createdAt: n.createdAt })),
      }, null, 2)
    }

    // ── list_templates ────────────────────────────────────────────────────────
    case 'list_templates': {
      const templates = await prisma.messageTemplate.findMany({ orderBy: { name: 'asc' } })
      return JSON.stringify(templates.map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        bodyPreview: t.body.slice(0, 120) + (t.body.length > 120 ? '…' : ''),
      })), null, 2)
    }

    // ── get_template ──────────────────────────────────────────────────────────
    case 'get_template': {
      if (!args.templateId) throw new Error('templateId is required')
      const t = await prisma.messageTemplate.findUnique({ where: { id: args.templateId } })
      if (!t) throw new Error('Template not found')
      return JSON.stringify(t, null, 2)
    }

    // ── create_template ───────────────────────────────────────────────────────
    case 'create_template': {
      const { name, subject, body } = args
      if (!name?.trim() || !subject?.trim() || !body?.trim()) throw new Error('name, subject, and body are required')
      const t = await prisma.messageTemplate.create({
        data: { name: name.trim(), subject: subject.trim(), body: body.trim() },
      })
      return JSON.stringify({ ok: true, created: t }, null, 2)
    }

    // ── update_template ───────────────────────────────────────────────────────
    case 'update_template': {
      if (!args.templateId) throw new Error('templateId is required')
      const existing = await prisma.messageTemplate.findUnique({ where: { id: args.templateId } })
      if (!existing) throw new Error('Template not found')
      const t = await prisma.messageTemplate.update({
        where: { id: args.templateId },
        data: {
          ...(args.name    !== undefined && { name: args.name.trim() }),
          ...(args.subject !== undefined && { subject: args.subject.trim() }),
          ...(args.body    !== undefined && { body: args.body.trim() }),
        },
      })
      return JSON.stringify({ ok: true, updated: t }, null, 2)
    }

    // ── delete_template ───────────────────────────────────────────────────────
    case 'delete_template': {
      if (!args.templateId) throw new Error('templateId is required')
      await prisma.messageTemplate.delete({ where: { id: args.templateId } })
      return JSON.stringify({ ok: true, deleted: args.templateId })
    }

    // ── get_pipeline_stats ────────────────────────────────────────────────────
    case 'get_pipeline_stats': {
      const where = args.jobId ? { jobId: args.jobId } : {}
      const stages = await prisma.application.groupBy({
        by: ['stage'],
        where,
        _count: { _all: true },
      })
      const STAGE_ORDER = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']
      const counts = Object.fromEntries(stages.map(s => [s.stage, s._count._all]))
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      const result: Record<string, any> = { total }
      for (const stage of STAGE_ORDER) {
        const count = counts[stage] ?? 0
        result[stage] = { count, pct: total ? Math.round((count / total) * 100) : 0 }
      }
      return JSON.stringify(result, null, 2)
    }

    // ── list_message_logs ─────────────────────────────────────────────────────
    case 'list_message_logs': {
      if (!args.candidateId) throw new Error('candidateId is required')
      const limit = Math.min(args.limit ?? 20, 100)
      const logs = await prisma.messageLog.findMany({
        where: { candidateId: args.candidateId },
        orderBy: { sentAt: 'desc' },
        take: limit,
      })
      return JSON.stringify(logs.map(l => ({
        direction: l.direction,
        subject: l.subject,
        body: l.body,
        sentAt: l.sentAt,
        sentBy: l.sentByName,
        read: l.read,
      })), null, 2)
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  if (!authorized(req)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized — check your CLAUDE_MCP_API_KEY' } },
      { status: 401 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return err(null, -32700, 'Parse error')
  }

  const { id, method, params } = body

  try {
    switch (method) {
      // ── initialize ──────────────────────────────────────────────────────────
      case 'initialize':
        return ok(id, {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'zbhire-ats', version: '1.0.0' },
          capabilities: { tools: {} },
        })

      // ── tools/list ──────────────────────────────────────────────────────────
      case 'tools/list':
        return ok(id, { tools: TOOLS })

      // ── tools/call ──────────────────────────────────────────────────────────
      case 'tools/call': {
        const toolName = params?.name as string
        const toolArgs = (params?.arguments ?? {}) as Record<string, any>
        const text = await callTool(toolName, toolArgs)
        return ok(id, {
          content: [{ type: 'text', text }],
          isError: false,
        })
      }

      // ── notifications (fire-and-forget, no response needed) ─────────────────
      case 'notifications/initialized':
        return new NextResponse(null, { status: 204 })

      default:
        return err(id, -32601, `Method not found: ${method}`)
    }
  } catch (e: any) {
    return ok(id, {
      content: [{ type: 'text', text: `Error: ${e.message}` }],
      isError: true,
    })
  }
}

// Claude.ai also does an OPTIONS preflight for cross-origin MCP connections
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
    },
  })
}
