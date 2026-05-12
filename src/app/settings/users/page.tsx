'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Trash2, ChevronDown, Copy, Check, Mail, ShieldAlert, ChevronRight, X, Briefcase, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type InterviewerProfile = { id: string; title: string | null; calendlyUrl: string | null }
type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string
  interviewerProfile: InterviewerProfile | null
}
type Invitation = {
  id: string; email: string; role: string; acceptedAt: string | null
  expiresAt: string; createdAt: string; invitedBy: { name: string | null; email: string | null }
}

const ROLES = ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER']
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
  INTERVIEWER: 'Interviewer',
}
const PROFILE_ROLES = ['RECRUITER', 'INTERVIEWER', 'HIRING_MANAGER']

function roleColor(role: string) {
  if (role === 'ADMIN') return 'bg-purple-100 text-purple-700'
  if (role === 'RECRUITER') return 'bg-blue-100 text-blue-700'
  if (role === 'HIRING_MANAGER') return 'bg-teal-100 text-teal-700'
  if (role === 'INTERVIEWER') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

type Job = { id: string; title: string; department: string; hiringManagerId: string | null }

function UserRow({
  user,
  isSelf,
  onSaved,
  onRemoved,
}: {
  user: User
  isSelf: boolean
  onSaved: (updated: User) => void
  onRemoved: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [role, setRole] = useState(user.role)
  const [title, setTitle] = useState(user.interviewerProfile?.title ?? '')
  const [calendlyUrl, setCalendlyUrl] = useState(user.interviewerProfile?.calendlyUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Job assignments (for HM role)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoaded, setJobsLoaded] = useState(false)
  const [togglingJob, setTogglingJob] = useState<string | null>(null)

  const effectiveRole = role
  const hasProfile = PROFILE_ROLES.includes(effectiveRole)
  const isHM = effectiveRole === 'HIRING_MANAGER'

  const loadJobs = useCallback(async () => {
    if (jobsLoaded) return
    const res = await fetch(`/api/users/${user.id}/jobs`)
    if (res.ok) {
      const data = await res.json()
      setJobs(data.jobs)
      setJobsLoaded(true)
    }
  }, [user.id, jobsLoaded])

  useEffect(() => {
    if (expanded && isHM && !jobsLoaded) loadJobs()
  }, [expanded, isHM, jobsLoaded, loadJobs])

  // Also reload when role switches to HM
  useEffect(() => {
    if (isHM && expanded && !jobsLoaded) loadJobs()
  }, [isHM, expanded, jobsLoaded, loadJobs])

  async function toggleJob(jobId: string, currentlyAssigned: boolean) {
    setTogglingJob(jobId)
    const res = await fetch(`/api/users/${user.id}/jobs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, assign: !currentlyAssigned }),
    })
    setTogglingJob(null)
    if (res.ok) {
      setJobs(prev => prev.map(j =>
        j.id === jobId
          ? { ...j, hiringManagerId: currentlyAssigned ? null : user.id }
          : // unassign from others if assigning (one HM per job)
            !currentlyAssigned ? { ...j, hiringManagerId: j.hiringManagerId === user.id ? null : j.hiringManagerId } : j
      ))
    } else {
      toast.error('Failed to update job assignment')
    }
  }

  async function save() {
    setSaving(true)
    const body: Record<string, string> = { role }
    if (hasProfile) {
      body.title = title
      body.calendlyUrl = calendlyUrl
    }
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      onSaved(updated)
      setExpanded(false)
      toast.success('Saved')
    } else {
      toast.error('Failed to save')
    }
  }

  async function remove() {
    if (!confirm(`Remove ${user.name ?? user.email}? This cannot be undone.`)) return
    setRemoving(true)
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    setRemoving(false)
    if (res.ok) {
      onRemoved(user.id)
      toast.success('User removed')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to remove')
    }
  }

  const assignedJobs = jobs.filter(j => j.hiringManagerId === user.id)

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {(user.name ?? user.email ?? '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.name ?? '—'}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {user.interviewerProfile?.calendlyUrl && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Calendly
            </span>
          )}
          {user.interviewerProfile?.title && (
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[120px]">
              {user.interviewerProfile.title}
            </span>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor(user.role)}`}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
          <div className="max-w-lg pt-4 space-y-4">

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role</label>
              <div className="relative inline-block">
                <select
                  value={role}
                  onChange={e => { setRole(e.target.value); setJobsLoaded(false) }}
                  disabled={isSelf}
                  className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              {isSelf && <p className="text-xs text-gray-400 mt-1">You cannot change your own role.</p>}
            </div>

            {/* Profile fields — Interviewer / Hiring Manager */}
            {hasProfile && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="input w-full max-w-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Calendly Link</label>
                  <input
                    type="url"
                    value={calendlyUrl}
                    onChange={e => setCalendlyUrl(e.target.value)}
                    placeholder="https://calendly.com/username/30min"
                    className="input w-full max-w-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Used to generate self-scheduling links for candidates</p>
                </div>
              </>
            )}

            {/* Job assignments — Hiring Manager only */}
            {isHM && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <label className="text-xs font-semibold text-gray-500">Job Assignments</label>
                  {assignedJobs.length > 0 && (
                    <span className="text-xs text-teal-600 font-medium">
                      {assignedJobs.length} assigned
                    </span>
                  )}
                </div>
                {!jobsLoaded ? (
                  <p className="text-xs text-gray-400">Loading jobs…</p>
                ) : jobs.length === 0 ? (
                  <p className="text-xs text-gray-400">No open jobs found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {jobs.map(job => {
                      const assigned = job.hiringManagerId === user.id
                      const takenBy = job.hiringManagerId && job.hiringManagerId !== user.id
                      return (
                        <label
                          key={job.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                            assigned
                              ? 'border-teal-200 bg-teal-50'
                              : takenBy
                              ? 'border-gray-100 bg-gray-50 opacity-60'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={assigned}
                            disabled={!!togglingJob || (!!takenBy && !assigned)}
                            onChange={() => toggleJob(job.id, assigned)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs text-gray-400">{job.department}</p>
                          </div>
                          {takenBy && (
                            <span className="text-xs text-gray-400 flex-shrink-0">assigned</span>
                          )}
                          {togglingJob === job.id && (
                            <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5">Changes save immediately when you check/uncheck</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button onClick={save} disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setExpanded(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
              {!isSelf && (
                <button
                  onClick={remove}
                  disabled={removing}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {removing ? 'Removing…' : 'Remove user'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsersSettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const currentUserId = (session?.user as any)?.id as string | undefined

  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('RECRUITER')
  const [inviting, setInviting] = useState(false)
  const [newLink, setNewLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [u, i] = await Promise.all([
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/invitations').then(r => r.ok ? r.json() : []),
    ])
    setUsers(u)
    setInvitations(i)
    setLoading(false)
  }

  async function bootstrap() {
    setBootstrapping(true)
    const res = await fetch('/api/admin/bootstrap', { method: 'POST' })
    const data = await res.json()
    setBootstrapping(false)
    if (res.ok) toast.success(data.message ?? 'Done! Sign out and back in.')
    else toast.error(data.error || 'Failed.')
  }

  async function invite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    setInviting(false)
    if (res.ok) {
      toast.success(`Invitation sent to ${inviteEmail}`)
      setNewLink(data.link)
      setInviteEmail('')
      await load()
    } else {
      toast.error(data.error || 'Failed to send invitation.')
    }
  }

  async function revokeInvite(id: string) {
    const res = await fetch('/api/invitations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setInvitations(prev => prev.filter(i => i.id !== id)); toast.success('Invitation revoked.') }
  }

  async function resendInvite(id: string, email: string) {
    const res = await fetch('/api/invitations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (res.ok) {
      setNewLink(data.link)
      // Refresh so the new expiry shows
      await load()
      toast.success(`Invite resent to ${email}`)
    } else {
      toast.error('Failed to resend invitation.')
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="p-4 md:p-8 text-sm text-gray-400">Loading…</div>

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Team & Users</h1>
        <div className="card p-6 flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="w-10 h-10 text-yellow-500" />
          <div>
            <p className="font-semibold text-gray-900">Admin access required</p>
            <p className="text-sm text-gray-500 mt-1">
              Your account doesn&apos;t have the Admin role yet. If you&apos;re the only user, click below to fix it.
            </p>
          </div>
          <button onClick={bootstrap} disabled={bootstrapping} className="btn-primary">
            {bootstrapping ? 'Fixing…' : 'Make me Admin (first-time setup)'}
          </button>
          <p className="text-xs text-gray-400">After clicking, sign out and sign back in.</p>
        </div>
      </div>
    )
  }

  const pendingInvites = invitations.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date())

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team & Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage access, roles, and profiles for everyone on your team
        </p>
      </div>

      {/* Invite */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Invite a team member</h2>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && invite()}
            className="input flex-1"
          />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input w-44">
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={invite} disabled={inviting || !inviteEmail.trim()} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {inviting ? 'Sending…' : 'Invite'}
          </button>
        </div>

        {newLink && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-700 truncate">Invite link: {newLink}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => copyLink(newLink)} className="text-blue-600 hover:text-blue-800">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => setNewLink('')} className="text-blue-400 hover:text-blue-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team members */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Team members ({users.length})</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click any row to edit role, title, or Calendly link</p>
        </div>
        <div>
          {users.map(user => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onSaved={updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
              onRemoved={id => setUsers(prev => prev.filter(u => u.id !== id))}
            />
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pending invitations ({pendingInvites.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Invited by {inv.invitedBy.name ?? inv.invitedBy.email} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor(inv.role)}`}>
                  {ROLE_LABELS[inv.role] ?? inv.role}
                </span>
                <button
                  onClick={() => resendInvite(inv.id, inv.email)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Resend
                </button>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
