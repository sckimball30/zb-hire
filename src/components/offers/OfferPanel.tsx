'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Copy, Check, ExternalLink, Send, Trash2, Edit2, FileText } from 'lucide-react'
import { CreateOfferModal } from './CreateOfferModal'
import { CreateOfferButton } from './CreateOfferButton'

interface Offer {
  id: string
  applicationId: string
  jobTitle: string
  salary: number | null
  salaryType: string
  currency: string
  startDate: string | null
  expiresAt: string | null
  status: string
  notes: string | null
  token: string
  sentAt: string | null
  respondedAt: string | null
  createdAt: string
  signedPdfUrl: string | null
  employmentType: string | null
  bonus: string | null
}

interface Props {
  offer: Offer | null
  applicationId: string
  jobTitle: string
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-600',
}

function formatSalary(salary: number | null, salaryType: string, currency: string) {
  if (!salary) return null
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(salary)
  return salaryType === 'HOURLY' ? `${formatted}/hr` : `${formatted}/yr`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function OfferPanel({ offer, applicationId, jobTitle }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const offerLink = offer ? `https://zb-hires.vercel.app/offers/${offer.token}` : ''

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(offerLink)
    setCopiedLink(true)
    toast.success('Offer link copied!')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSend = async () => {
    if (!offer) return
    setSendLoading(true)
    try {
      const res = await fetch(`/api/offers/${offer.id}/send`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send offer')
      }
      toast.success('Offer sent! Share the link with the candidate.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send offer')
    } finally {
      setSendLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!offer) return
    if (!confirm('Are you sure you want to delete this offer? This cannot be undone.')) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete offer')
      }
      toast.success('Offer deleted.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete offer')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Offer</h2>
          {offer && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[offer.status] || STATUS_STYLES.DRAFT}`}>
              {offer.status}
            </span>
          )}
        </div>

        {!offer && (
          <CreateOfferButton applicationId={applicationId} jobTitle={jobTitle} />
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {!offer ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No offer created yet.</p>
            <p className="text-xs text-gray-400 mt-1">Create an offer to send to this candidate.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Key details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Position</div>
                <div className="text-sm font-medium text-gray-900">{offer.jobTitle}</div>
              </div>

              {offer.salary && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Compensation</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatSalary(offer.salary, offer.salaryType, offer.currency)}
                  </div>
                </div>
              )}

              {offer.startDate && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Start Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(offer.startDate)}</div>
                </div>
              )}

              {offer.expiresAt && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Expires</div>
                  <div className="text-sm font-medium text-amber-600">{formatDate(offer.expiresAt)}</div>
                </div>
              )}
            </div>

            {/* SENT: show offer link */}
            {offer.status === 'SENT' && (
              <div className="rounded-xl border border-[#4AFFD2]/30 bg-[#4AFFD2]/5 p-4">
                <div className="text-xs text-gray-500 mb-2 font-medium">Candidate Link</div>
                <div className="text-xs text-gray-600 break-all mb-3 font-mono bg-white border border-gray-100 rounded-lg px-3 py-2">
                  {offerLink}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4AFFD2] text-[#111] text-xs font-semibold hover:bg-[#4AFFD2]/80 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                  <a
                    href={offerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </a>
                </div>
                {offer.sentAt && (
                  <div className="text-xs text-gray-400 mt-2">Sent on {formatDate(offer.sentAt)}</div>
                )}
              </div>
            )}

            {/* ACCEPTED: show confirmation */}
            {offer.status === 'ACCEPTED' && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold">Offer Accepted</span>
                </div>
                {offer.respondedAt && (
                  <div className="text-xs text-green-600 mt-1 ml-6">
                    Responded on {formatDate(offer.respondedAt)}
                  </div>
                )}
                {offer.signedPdfUrl && (
                  <div className="mt-3 ml-6">
                    <a
                      href={offer.signedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Download Signed Offer
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* DECLINED: show notification */}
            {offer.status === 'DECLINED' && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-semibold">Offer Declined</span>
                </div>
                {offer.respondedAt && (
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    Responded on {formatDate(offer.respondedAt)}
                  </div>
                )}
              </div>
            )}

            {/* DRAFT: edit, send, delete */}
            {offer.status === 'DRAFT' && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setEditOpen(true)}
                  className="btn-outline text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={handleSend}
                  disabled={sendLoading}
                  className="btn-primary text-xs"
                >
                  <Send className="w-3 h-3" />
                  {sendLoading ? 'Sending...' : 'Send Offer'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editOpen && offer && (
        <CreateOfferModal
          applicationId={applicationId}
          jobTitle={jobTitle}
          onClose={() => setEditOpen(false)}
          existingOffer={{
            id: offer.id,
            jobTitle: offer.jobTitle,
            salary: offer.salary,
            salaryType: offer.salaryType,
            currency: offer.currency,
            startDate: offer.startDate,
            expiresAt: offer.expiresAt,
            notes: offer.notes,
            employmentType: offer.employmentType,
            bonus: offer.bonus,
          }}
        />
      )}
    </div>
  )
}
