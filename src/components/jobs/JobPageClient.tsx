'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Users, ChevronDown, ChevronUp, UserPlus, Trash2, ExternalLink, Copy, Check, Bell, BellOff, Star } from 'lucide-react'
import { toast } from 'sonner'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { EditJobModal } from '@/components/jobs/EditJobModal'
import { initials } from '@/lib/utils'
import type { ApplicationWithRelations, CandidateStage, Interviewer, JobInterviewer } from '@/types'

type Job = {
  id: string; title: string; department: string | null; location: string | null
  description: string | null; status: string; employmentType: string | null
  payType: string | null; salaryMin: number | null; salaryMax: number | null
  salaryCurrency: string; hiringGoal: number | null; interviewCount: number
}

type TeamMember = JobInterviewer & { interviewer: Interviewer }

type RecruiterUser = { id: string; name: string | null; email: string | null }
type RecruiterAssignment = {
  id: string; userId: string; isMain: boolean; emailNotifications: boolean; user: RecruiterUser
}

interface JobPageClientProps {
  job: Job
  groupedApplications: Record<CandidateStage, ApplicationWithRelations[]>
  currentTeam: TeamMember[]
  allInterviewers: Interviewer[]
  currentRecruiters: RecruiterAssignment[]
  allRecruiters: RecruiterUser[]
  jobStatusColors: Record<string, string>
  jobStatusLabels: Record<string, string>
}

const STATUS_CYCLE: Record<string, string> = {
  DRAFT: 'OPEN', OPEN: 'CLOSED', CLOSED: 'ARCHIVED', ARCHIVED: 'DRAFT',
}

const STATUS_NEXT_LABEL: Record<string, string> = {
  DRAFT: 'Publish (set to Open)',
  OPEN: 'Close role',
  CLOSED: 'Archive',
  ARCHIVED: 'Reopen as Draft',
}

export function JobPageClient({
  job, groupedApplications, currentTeam, allInterviewers,
  currentRecruiters, allRecruiters,
  jobStatusColors, jobStatusLabels,
}: JobPageClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(job.status)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showTeam, setShowTeam] = useState(true)
  const [team, setTeam] = useState(currentTeam)
  const [available, setAvailable] = useState(
    allInterviewers.filter(i => !currentTeam.some(m => m.interviewerId === i.id))
  )
  const [selectedId, setSelectedId] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [copied, setCopied] = useState(false)

  // Recruiter state
  const [recruiters, setRecruiters] = useState(currentRecruiters)
  const [availableRecruiters, setAvailableRecruiters] = useState(
    allRecruiters.filter(u => !currentRecruiters.some(r => r.userId === u.id))
  )
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('')
  const [addingRecruiter, setAddingRecruiter] = useState(false)

  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const applyUrl = `${origin}/apply/${job.id}`

  async function toggleStatus() {
    const next = STATUS_CYCLE[status]
    setTogglingStatus(true)
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setTogglingStatus(false)
    if (res.ok) {
      setStatus(next)
      toast.success(`Status changed to ${jobStatusLabels[next]}`)
      router.refresh()
    } else {
      toast.error('Failed to update status.')
    }
  }

  async function addInterviewer() {
    if (!selectedId) return
    setAddingMember(true)
    const res = await fetch(`/api/jobs/${job.id}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewerId: selectedId, role: roleLabel || undefined }),
    })
    setAddingMember(false)
    if (res.ok) {
      const newMember = await res.json()
      const interviewer = available.find(i => i.id === selectedId)!
      setTeam(prev => [...prev, { ...newMember, interviewer }])
      setAvailable(prev => prev.filter(i => i.id !== selectedId))
      setSelectedId(''); setRoleLabel('')
      toast.success('Interviewer added.')
      router.refresh()
    } else {
      const d = await res.json(); toast.error(d.error || 'Failed to add.')
    }
  }

  async function removeInterviewer(interviewerId: string) {
    const res = await fetch(`/api/jobs/${job.id}/team`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewerId }),
    })
    if (res.ok) {
      const removed = team.find(m => m.interviewerId === interviewerId)
      setTeam(prev => prev.filter(m => m.interviewerId !== interviewerId))
      if (removed) setAvailable(prev => [...prev, removed.interviewer].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Interviewer removed.')
      router.refresh()
    } else {
      toast.error('Failed to remove.')
    }
  }

  function copyApplyLink() {
    navigator.clipboard.writeText(applyUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function addRecruiter(isMain: boolean) {
    if (!selectedRecruiterId) return
    setAddingRecruiter(true)
    const res = await fetch(`/api/jobs/${job.id}/recruiters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedRecruiterId, isMain }),
    })
    setAddingRecruiter(false)
    if (res.ok) {
      const newAssignment = await res.json()
      // If set as main, demote any previous main in local state
      setRecruiters(prev => {
        const updated = isMain ? prev.map(r => ({ ...r, isMain: false })) : prev
        return [...updated, newAssignment]
      })
      setAvailableRecruiters(prev => prev.filter(u => u.id !== selectedRecruiterId))
      setSelectedRecruiterId('')
      toast.success(`Recruiter added as ${isMain ? 'Main' : 'Support'}.`)
      router.refresh()
    } else {
      const d = await res.json(); toast.error(d.error || 'Failed to add recruiter.')
    }
  }

  async function removeRecruiter(userId: string) {
    const res = await fetch(`/api/jobs/${job.id}/recruiters`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      const removed = recruiters.find(r => r.userId === userId)
      setRecruiters(prev => prev.filter(r => r.userId !== userId))
      if (removed) setAvailableRecruiters(prev => [...prev, removed.user].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
      toast.success('Recruiter removed.')
      router.refresh()
    } else {
      toast.error('Failed to remove recruiter.')
    }
  }

  async function toggleRecruiterMain(userId: string, currentIsMain: boolean) {
    const res = await fetch(`/api/jobs/${job.id}/recruiters`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isMain: !currentIsMain }),
    })
    if (res.ok) {
      setRecruiters(prev => prev.map(r => ({
        ...r,
        isMain: r.userId === userId ? !currentIsMain : ((!currentIsMain) ? false : r.isMain),
      })))
      toast.success(!currentIsMain ? 'Set as Main Recruiter.' : 'Changed to Support Recruiter.')
      router.refresh()
    } else {
      toast.error('Failed to update.')
    }
  }

  async function toggleEmailNotifications(userId: string, current: boolean) {
    const res = await fetch(`/api/jobs/${job.id}/recruiters`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emailNotifications: !current }),
    })
    if (res.ok) {
      setRecruiters(prev => prev.map(r => r.userId === userId ? { ...r, emailNotifications: !current } : r))
      toast.success(!current ? 'Email alerts turned on.' : 'Email alerts turned off.')
    } else {
      toast.error('Failed to update.')
    }
  }

  return (
    <>
      {/* Action bar */}
      <div className="px-8 py-3 bg-white border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        {/* Status badge + toggle */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${jobStatusColors[status]}`}>
          {jobStatusLabels[status]}
        </span>
        <button
          onClick={toggleStatus}
          disabled={togglingStatus}
          className="btn-outline text-xs py-1.5"
        >
          {togglingStatus ? 'Updating…' : STATUS_NEXT_LABEL[status]}
        </button>

        {/* Apply link when open */}
        {status === 'OPEN' && (
          <div className="flex items-center gap-1.5 ml-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-green-700 font-medium">Apply link:</span>
            <span className="text-xs text-green-600 truncate max-w-xs">{applyUrl}</span>
            <button onClick={copyApplyLink} className="text-green-600 hover:text-green-800 ml-1">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowTeam(t => !t)} className="btn-outline text-xs py-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Team ({team.length})
            {showTeam ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={() => setShowEdit(true)} className="btn-outline text-xs py-1.5 flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            Edit Job
          </button>
        </div>
      </div>

      {/* Team panel — collapsible */}
      {showTeam && (
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start gap-6 flex-wrap">

            {/* ── Recruiters ── */}
            <div className="w-full border-b border-gray-200 pb-4 mb-2">
              <div className="flex items-start gap-6 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recruiters</p>
                  {recruiters.length === 0 ? (
                    <p className="text-sm text-gray-400">No recruiters assigned yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recruiters.map(r => (
                        <div key={r.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 group">
                          <div className="w-6 h-6 rounded-full bg-[#4AFFD2]/20 text-[#111] text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {initials((r.user.name ?? r.user.email ?? '?').split(' ')[0], (r.user.name ?? '').split(' ').slice(-1)[0])}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 leading-tight">{r.user.name ?? r.user.email}</p>
                            <p className="text-xs text-gray-400 leading-tight">{r.isMain ? 'Main Recruiter' : 'Support'}</p>
                          </div>
                          {/* Toggle main */}
                          <button
                            onClick={() => toggleRecruiterMain(r.userId, r.isMain)}
                            title={r.isMain ? 'Demote to Support' : 'Set as Main'}
                            className={`ml-0.5 transition-colors ${r.isMain ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                          >
                            <Star className="w-3.5 h-3.5" fill={r.isMain ? 'currentColor' : 'none'} />
                          </button>
                          {/* Toggle email notifications */}
                          <button
                            onClick={() => toggleEmailNotifications(r.userId, r.emailNotifications)}
                            title={r.emailNotifications ? 'Turn off email alerts' : 'Turn on email alerts'}
                            className={`transition-colors ${r.emailNotifications ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
                          >
                            {r.emailNotifications ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                          </button>
                          {/* Remove */}
                          <button
                            onClick={() => removeRecruiter(r.userId)}
                            className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add recruiter */}
                {availableRecruiters.length > 0 && (
                  <div className="flex items-end gap-2 flex-shrink-0">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Recruiter</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRecruiterId}
                          onChange={e => setSelectedRecruiterId(e.target.value)}
                          className="input text-sm py-1.5 w-48"
                        >
                          <option value="">Select recruiter…</option>
                          {availableRecruiters.map(u => (
                            <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => addRecruiter(recruiters.length === 0)}
                          disabled={!selectedRecruiterId || addingRecruiter}
                          className="btn-primary text-xs py-1.5 flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {addingRecruiter ? 'Adding…' : recruiters.length === 0 ? 'Add as Main' : 'Add as Support'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">★ = Main  ·  First added is set as main automatically</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* ── END Recruiters ── */}
            {/* Current team */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interview Team</p>
              {team.length === 0 ? (
                <p className="text-sm text-gray-400">No interviewers assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {team.map(member => (
                    <div key={member.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 group">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {initials(member.interviewer.name.split(' ')[0], member.interviewer.name.split(' ').slice(-1)[0])}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 leading-tight">{member.interviewer.name}</p>
                        {(member.role || member.interviewer.title) && (
                          <p className="text-xs text-gray-400 leading-tight truncate">
                            {member.role ?? member.interviewer.title}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeInterviewer(member.interviewerId)}
                        className="ml-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add interviewer */}
            {available.length > 0 && (
              <div className="flex items-end gap-2 flex-shrink-0">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Interviewer</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="input text-sm py-1.5 w-48"
                    >
                      <option value="">Select interviewer…</option>
                      {available.map(i => (
                        <option key={i.id} value={i.id}>{i.name}{i.title ? ` (${i.title})` : ''}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={roleLabel}
                      onChange={e => setRoleLabel(e.target.value)}
                      placeholder="Role (optional)"
                      className="input text-sm py-1.5 w-36"
                    />
                    <button
                      onClick={addInterviewer}
                      disabled={!selectedId || addingMember}
                      className="btn-primary text-xs py-1.5 flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {addingMember ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <KanbanBoard groupedApplications={groupedApplications} jobId={job.id} />
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditJobModal
          job={{ ...job, status }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
