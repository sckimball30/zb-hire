'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Trash2, ChevronDown, Copy, Check, Mail, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, timeAgo } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type User = { id: string; name: string | null; email: string | null; role: string; createdAt: string }
type Invitation = {
  id: string; email: string; role: string; acceptedAt: string | null
  expiresAt: string; createdAt: string; invitedBy: { name: string | null; email: string | null }
}

const ROLES = ['ADMIN', 'RECRUITER', 'INTERVIEWER']

export default function UsersSettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
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
    if (res.ok) {
      toast.success(data.message ?? 'Done! Please sign out and sign back in.')
    } else {
      toast.error(data.error || 'Failed.')
    }
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

  async function changeRole(userId: string, role: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Role updated.')
    } else {
      toast.error('Failed to update role.')
    }
  }

  async function removeUser(userId: string) {
    if (!confirm('Remove this user?')) return
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (res.ok) { setUsers(prev => prev.filter(u => u.id !== userId)); toast.success('User removed.') }
    else { const d = await res.json(); toast.error(d.error || 'Failed.') }
  }

  async function revokeInvite(id: string) {
    const res = await fetch('/api/invitations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setInvitations(prev => prev.filter(i => i.id !== id)); toast.success('Invitation revoked.') }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  const pendingInvites = invitations.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date())

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg">
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
          <p className="text-xs text-gray-400">After clicking, sign out and sign back in for the change to take effect.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team & Users</h1>
        <p className="text-sm text-gray-500 mt-1">Manage who has access to your ATS workspace</p>
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
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input w-36">
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
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
            <button onClick={() => copyLink(newLink)} className="flex-shrink-0 text-blue-600 hover:text-blue-800">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Current Users */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Team members ({users.length})</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {(user.name ?? user.email ?? '?')[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{user.name ?? '—'}</span>
                  </div>
                </td>
                <td className="text-gray-600 text-sm">{user.email}</td>
                <td>
                  <div className="relative inline-block">
                    <select
                      value={user.role}
                      onChange={e => changeRole(user.id, e.target.value)}
                      className="appearance-none pr-6 pl-2 py-1 text-xs font-medium rounded-full border border-gray-200 bg-gray-50 text-gray-700 cursor-pointer hover:border-blue-300 focus:outline-none"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </td>
                <td className="text-gray-500 text-sm">{formatDate(user.createdAt)}</td>
                <td>
                  <button onClick={() => removeUser(user.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pending invitations ({pendingInvites.length})</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Invited by</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map(inv => (
                <tr key={inv.id}>
                  <td className="text-gray-800 font-medium">{inv.email}</td>
                  <td className="text-gray-600 text-sm capitalize">{inv.role.toLowerCase()}</td>
                  <td className="text-gray-500 text-sm">{inv.invitedBy.name ?? inv.invitedBy.email}</td>
                  <td className="text-gray-500 text-sm">{timeAgo(inv.expiresAt)}</td>
                  <td>
                    <button onClick={() => revokeInvite(inv.id)} className="text-gray-400 hover:text-red-500 text-xs">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
