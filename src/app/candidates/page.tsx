export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus, Download } from 'lucide-react'
import { SearchInput } from '@/components/shared/SearchInput'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q?.trim() || ''

  const candidates = await prisma.candidate.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : undefined,
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput placeholder="Search candidates..." defaultValue={query} />
          <a href="/api/export/candidates" className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <Link href="/candidates/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {candidates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">
              {query ? `No candidates found for "${query}"` : 'No candidates yet. Add your first candidate.'}
            </p>
            {!query && (
              <Link href="/candidates/new" className="btn-primary mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Add Candidate
              </Link>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Source</th>
                <th>Applications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0">
                        {candidate.firstName[0]}{candidate.lastName[0]}
                      </div>
                      <div className="font-medium text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{candidate.email}</td>
                  <td className="text-gray-600">{candidate.phone || '—'}</td>
                  <td className="text-gray-600">{candidate.source || '—'}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {candidate._count.applications}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
