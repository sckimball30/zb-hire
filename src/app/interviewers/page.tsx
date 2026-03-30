export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { initials } from '@/lib/utils'

export default async function InterviewersPage() {
  const interviewers = await prisma.interviewer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      calendlyUrl: true,
      _count: {
        select: { jobAssignments: true, scorecards: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interviewers</h1>
          <p className="text-sm text-gray-500 mt-1">{interviewers.length} interviewer{interviewers.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/interviewers/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Interviewer
        </Link>
      </div>

      <div className="card overflow-hidden">
        {interviewers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No interviewers yet.</p>
            <Link href="/interviewers/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Add Interviewer
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Title</th>
                <th>Calendly</th>
                <th>Job Assignments</th>
                <th>Scorecards</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {interviewers.map((interviewer) => (
                <tr key={interviewer.id} className="cursor-pointer hover:bg-gray-50">
                  <td>
                    <Link href={`/interviewers/${interviewer.id}/edit`} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0">
                        {initials(
                          interviewer.name.split(' ')[0],
                          interviewer.name.split(' ').slice(-1)[0]
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{interviewer.name}</span>
                    </Link>
                  </td>
                  <td className="text-gray-600">{interviewer.email}</td>
                  <td className="text-gray-600">{interviewer.title || '—'}</td>
                  <td>
                    {interviewer.calendlyUrl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#4AFFD2]/20 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Set up
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not set</span>
                    )}
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {interviewer._count.jobAssignments} job{interviewer._count.jobAssignments !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {interviewer._count.scorecards}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/interviewers/${interviewer.id}/edit`}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Edit
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
