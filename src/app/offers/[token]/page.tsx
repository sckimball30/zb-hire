export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OfferResponseButtons } from '@/components/offers/OfferResponseButtons'

function formatSalary(salary: number | null, salaryType: string, currency: string) {
  if (!salary) return null
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(salary)
  return salaryType === 'HOURLY' ? `${formatted}/hr` : `${formatted}/yr`
}

function formatDate(date: Date | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function OfferLetterPage({
  params,
}: {
  params: { token: string }
}) {
  const offer = await prisma.offer.findUnique({
    where: { token: params.token },
    include: {
      application: {
        include: {
          candidate: true,
          job: true,
        },
      },
    },
  })

  if (!offer) notFound()

  const { application } = offer
  const { candidate, job } = application

  const isExpired =
    offer.expiresAt && new Date(offer.expiresAt) < new Date() && offer.status === 'SENT'

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Letter container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Company header */}
          <div className="bg-[#111111] px-8 py-8 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">ZB Designs</div>
              <div className="text-sm text-[#4AFFD2] mt-1 font-medium">Powered by Wigglitz</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-widest">Offer Letter</div>
              <div className="text-sm text-gray-300 mt-1">{today}</div>
            </div>
          </div>

          {/* Status banners */}
          {offer.status === 'ACCEPTED' && (
            <div className="bg-green-50 border-b border-green-200 px-8 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-800">Offer Accepted</div>
                <div className="text-xs text-green-600">
                  You accepted this offer on {formatDate(offer.respondedAt)}. Congratulations!
                </div>
              </div>
            </div>
          )}

          {offer.status === 'DECLINED' && (
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700">Offer Declined</div>
                <div className="text-xs text-gray-500">
                  You declined this offer on {formatDate(offer.respondedAt)}.
                </div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-amber-50 border-b border-amber-200 px-8 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-800">Offer Expired</div>
                <div className="text-xs text-amber-600">
                  This offer expired on {formatDate(offer.expiresAt)}. Please contact us if you have questions.
                </div>
              </div>
            </div>
          )}

          {/* Letter body */}
          <div className="px-8 py-8">
            {/* Candidate greeting */}
            <p className="text-gray-500 text-sm mb-1">Dear</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {candidate.firstName} {candidate.lastName}
            </h1>

            <p className="text-gray-700 leading-relaxed mb-6">
              We are pleased to offer you the position of <strong>{offer.jobTitle}</strong> at{' '}
              <strong>ZB Designs</strong>. After careful consideration, we believe your skills and
              experience make you an excellent fit for our team, and we look forward to welcoming
              you aboard.
            </p>

            {/* Offer details card */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 mb-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Offer Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Position</div>
                  <div className="text-sm font-semibold text-gray-900">{offer.jobTitle}</div>
                </div>

                {offer.employmentType && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Employment Type</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {offer.employmentType === 'FULL_TIME' ? 'Full-time' : 'Part-time'}
                    </div>
                  </div>
                )}

                {job.department && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Department</div>
                    <div className="text-sm font-semibold text-gray-900">{job.department}</div>
                  </div>
                )}

                {offer.salary && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Compensation</div>
                    <div className="text-sm font-semibold text-[#111]">
                      {formatSalary(offer.salary, offer.salaryType, offer.currency)}
                    </div>
                  </div>
                )}

                {offer.startDate && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Start Date</div>
                    <div className="text-sm font-semibold text-gray-900">{formatDate(offer.startDate)}</div>
                  </div>
                )}

                {offer.expiresAt && offer.status === 'SENT' && !isExpired && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Offer Expires</div>
                    <div className="text-sm font-semibold text-amber-600">{formatDate(offer.expiresAt)}</div>
                  </div>
                )}

                {job.location && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Location</div>
                    <div className="text-sm font-semibold text-gray-900">{job.location}</div>
                  </div>
                )}
              </div>
            </div>

            {offer.bonus && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bonus Structure</h3>
                <div className="text-sm text-gray-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg p-4 whitespace-pre-wrap">
                  {offer.bonus}
                </div>
              </div>
            )}

            {offer.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Terms</h3>
                <div className="text-sm text-gray-600 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg p-4 whitespace-pre-wrap">
                  {offer.notes}
                </div>
              </div>
            )}

            <p className="text-gray-700 leading-relaxed mb-6">
              Please review these terms carefully. If you have any questions or would like to discuss
              any aspect of this offer, feel free to reach out to us directly. We are excited about
              the possibility of you joining our team and hope you will accept.
            </p>

            <p className="text-gray-700 mb-8">
              Sincerely,<br />
              <span className="font-semibold text-gray-900">The ZB Designs Team</span>
            </p>

            {/* Response section */}
            {offer.status === 'SENT' && !isExpired && (
              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Please respond to this offer by {offer.expiresAt ? formatDate(offer.expiresAt) : 'as soon as possible'}.
                </p>
                <OfferResponseButtons token={params.token} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4">
            <p className="text-xs text-gray-400 text-center">
              This offer letter was sent via ZB Designs / Wigglitz ATS.
              Confidential — intended for {candidate.firstName} {candidate.lastName} only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
