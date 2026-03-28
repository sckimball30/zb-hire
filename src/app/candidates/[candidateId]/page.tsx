import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Mail, Phone, Linkedin, ExternalLink, MapPin, FileText, Download } from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { NotesPanel } from '@/components/candidates/NotesPanel'
import { SendMessageButton } from '@/components/candidates/SendMessageButton'

export default async function CandidatePage({ params }: { params: { candidateId: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    include: {
      applications: { include: { job: true }, orderBy: { createdAt: 'desc' } },
      candidateNotes: { orderBy: { createdAt: 'desc' } },
      messageLogs: { orderBy: { sentAt: 'desc' }, take: 10 },
    },
  })

  if (!candidate) notFound()

  const serializedNotes = candidate.candidateNotes.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }))

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/candidates" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Candidates
        </Link>
      </div>

      {/* Candidate Profile */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex-shrink-0">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {candidate.firstName} {candidate.lastName}
            </h1>
            {candidate.source && (
              <p className="text-sm text-gray-500 mt-0.5">Source: {candidate.source}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
                <Mail className="w-4 h-4" />
                {candidate.email}
              </a>
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
                  <Phone className="w-4 h-4" />
                  {candidate.phone}
                </a>
              )}
              {candidate.address && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {candidate.address}
                </span>
              )}
              {candidate.linkedInUrl && (
                <a href={candidate.linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {candidate.resumeUrl && (
                <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download Resume
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right text-sm text-gray-500">Added {formatDate(candidate.createdAt)}</div>
            <SendMessageButton candidateId={candidate.id} candidateEmail={candidate.email} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: notes + message history */}
        <div className="col-span-2 space-y-6">
          <NotesPanel candidateId={candidate.id} initialNotes={serializedNotes} />

          {/* Message History */}
          {candidate.messageLogs.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Message History</h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {candidate.messageLogs.map(msg => (
                  <li key={msg.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{msg.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {msg.sentByName && <span>{msg.sentByName} · </span>}
                          {formatDate(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Applications */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Applications ({candidate.applications.length})</h2>
            </div>
            {candidate.applications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No applications.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {candidate.applications.map(app => (
                  <li key={app.id} className="px-4 py-3">
                    <Link href={`/applications/${app.id}`} className="block hover:bg-gray-50 -mx-4 px-4 py-1 rounded transition-colors">
                      <p className="text-sm font-medium text-gray-900">{app.job.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
                          {STAGE_LABELS[app.stage]}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[app.job.status]}`}>
                          {JOB_STATUS_LABELS[app.job.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(app.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
