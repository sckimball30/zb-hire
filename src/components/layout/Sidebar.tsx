'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Briefcase,
  Users,
  HelpCircle,
  UserCheck,
  LayoutDashboard,
  Mail,
  Inbox,
  Settings,
  LogOut,
  ChevronDown,
  BarChart2,
  Menu,
  X,
  BookOpen,
  Layers,
  Eye,
  Clapperboard,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

const RECRUITER_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs',      label: 'Jobs',       icon: Briefcase },
  { href: '/candidates',label: 'Candidates', icon: Users },
  { href: '/analytics', label: 'Analytics',  icon: BarChart2 },

  { href: '/inbox',     label: 'Inbox',      icon: Inbox },
]

const HIRING_MANAGER_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs',      label: 'Jobs',       icon: Briefcase },
  { href: '/candidates',label: 'Candidates', icon: Users },
  { href: '/analytics', label: 'Analytics',  icon: BarChart2 },
  { href: '/inbox',     label: 'Inbox',      icon: Inbox },
]

const RECRUITER_RESOURCES = [
  { href: '/questions',         label: 'Questions',   icon: HelpCircle },
  { href: '/messages/templates',label: 'Templates',   icon: Mail },
  { href: '/help',              label: 'Help Guide',  icon: BookOpen },
]

const HM_RESOURCES = [
  { href: '/help', label: 'Help Guide', icon: BookOpen },
]

const RESOURCE_PATHS = ['/questions', '/messages/templates', '/help']

const PREVIEW_ROLES = [
  { value: 'RECRUITER',      label: 'Recruiter' },
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
  { value: 'INTERVIEWER',    label: 'Interviewer' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [previewRole, setPreviewRole] = useState<string | null>(null)
  const [viewAsOpen, setViewAsOpen] = useState(false)

  const role = (session?.user as any)?.role as string | undefined

  // Read preview cookie on mount and when it changes
  const syncPreviewRole = useCallback(() => {
    const match = document.cookie.match(/zbhire_preview_role=([^;]+)/)
    setPreviewRole(match ? match[1] : null)
  }, [])

  useEffect(() => {
    syncPreviewRole()
    window.addEventListener('zbhire_preview_changed', syncPreviewRole)
    return () => window.removeEventListener('zbhire_preview_changed', syncPreviewRole)
  }, [syncPreviewRole])

  const activatePreview = async (targetRole: string) => {
    setViewAsOpen(false)
    await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: targetRole }),
    })
    syncPreviewRole()
    window.dispatchEvent(new Event('zbhire_preview_changed'))
    // Navigate to appropriate landing page for that role
    if (targetRole === 'INTERVIEWER') {
      router.push('/interviewer')
    } else if (targetRole === 'HIRING_MANAGER') {
      router.push('/hiring-manager')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  const exitPreview = async () => {
    await fetch('/api/preview', { method: 'DELETE' })
    setPreviewRole(null)
    window.dispatchEvent(new Event('zbhire_preview_changed'))
    router.push('/dashboard')
    router.refresh()
  }

  // Effective role for nav rendering: use preview if set
  const effectiveRole = previewRole ?? role

  const isResourceActive = RESOURCE_PATHS.some(p => pathname?.startsWith(p))
  const [resourcesOpen, setResourcesOpen] = useState(isResourceActive)

  // Keep open if navigating into a resource page
  useEffect(() => {
    if (isResourceActive) setResourcesOpen(true)
  }, [isResourceActive])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    fetch('/api/inbox/unread').then(r => r.json()).then(d => setUnreadCount(d.count ?? 0)).catch(() => {})
    const interval = setInterval(() => {
      fetch('/api/inbox/unread').then(r => r.json()).then(d => setUnreadCount(d.count ?? 0)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const isAuthPage       = pathname?.startsWith('/auth')
  const isPublicPage     = pathname?.startsWith('/apply') || pathname?.startsWith('/offers') || pathname?.startsWith('/careers')
  const isInterviewerHub = pathname?.startsWith('/interviewer')
  const isHMHub          = pathname?.startsWith('/hiring-manager')

  // Hide sidebar for interviewer/HM role UNLESS admin is previewing (they keep sidebar to switch back)
  if (isAuthPage || isPublicPage) return null
  if ((isInterviewerHub || effectiveRole === 'INTERVIEWER') && role !== 'ADMIN') return null
  if (isInterviewerHub && role === 'ADMIN' && !previewRole) return null
  if ((isHMHub || effectiveRole === 'HIRING_MANAGER') && role !== 'ADMIN') return null
  if (isHMHub && role === 'ADMIN' && !previewRole) return null

  const navItems      = effectiveRole === 'HIRING_MANAGER' ? HIRING_MANAGER_NAV : RECRUITER_NAV
  const resourceItems = effectiveRole === 'HIRING_MANAGER' ? HM_RESOURCES : RECRUITER_RESOURCES

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
          active
            ? 'bg-[#4AFFD2]/20 text-[#4AFFD2]'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#4AFFD2]' : 'text-white/40 group-hover:text-white/70'}`} />
        {label}
        {href === '/inbox' && unreadCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-blue-500 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    )
  }

  const NavLinks = () => (
    <>
      {/* Main nav items */}
      {navItems.map(item => (
        <NavLink key={item.href} {...item} />
      ))}

      {/* Resources group */}
      <div className="mt-0.5">
        <button
          onClick={() => setResourcesOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
            isResourceActive && !resourcesOpen
              ? 'bg-[#4AFFD2]/20 text-[#4AFFD2]'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Layers className={`w-4 h-4 flex-shrink-0 ${isResourceActive && !resourcesOpen ? 'text-[#4AFFD2]' : 'text-white/40 group-hover:text-white/70'}`} />
          <span className="flex-1 text-left">Resources</span>
          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''} ${isResourceActive && !resourcesOpen ? 'text-[#4AFFD2]' : 'text-white/30'}`} />
        </button>

        {resourcesOpen && (
          <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
            {resourceItems.map(item => {
              const active = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors group ${
                    active
                      ? 'bg-[#4AFFD2]/20 text-[#4AFFD2]'
                      : 'text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-[#4AFFD2]' : 'text-white/30 group-hover:text-white/60'}`} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  // Bottom tab items — same for all non-interviewer roles
  const BOTTOM_TABS = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/jobs',      icon: Briefcase,       label: 'Jobs' },
    { href: '/candidates',icon: Users,           label: 'People' },
    { href: '/inbox',     icon: Inbox,           label: 'Inbox' },
  ]

  return (
    <>
      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111111] border-t border-white/10 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {BOTTOM_TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative ${
                active ? 'text-[#4AFFD2]' : 'text-white/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-[#4AFFD2]' : 'text-white/50'}`} />
                {href === '/inbox' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] font-bold bg-blue-500 text-white leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
        {/* More — opens slide-out drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-white/50"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5 text-white/50" />
          <span>More</span>
        </button>
      </nav>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#111111] flex-shrink-0
          transition-transform duration-300 ease-in-out
          md:relative md:w-60 md:translate-x-0 md:z-auto md:inset-y-auto md:left-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ paddingLeft: 'env(safe-area-inset-left)' }}
      >
        {/* Logo row */}
        <div
          className="flex items-center justify-between px-5 py-5 border-b border-white/10 flex-shrink-0"
          style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white/10 flex-shrink-0">
              <span className="text-white font-black text-base tracking-tighter leading-none">ZB</span>
            </div>
            <div className="min-w-0">
              <span className="text-white font-bold text-base leading-tight block">ZB Hire</span>
              <span className="text-white/40 text-xs leading-tight">by ZB Designs</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* View As (admin only) */}
        {role === 'ADMIN' && (
          <div className="px-3 pb-1 flex-shrink-0 relative">
            {previewRole ? (
              <div className="rounded-lg bg-amber-500/20 border border-amber-400/30 px-3 py-2">
                <p className="text-xs text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> Previewing as {PREVIEW_ROLES.find(r => r.value === previewRole)?.label}
                </p>
                <button
                  onClick={exitPreview}
                  className="text-xs text-amber-200 hover:text-white underline"
                >
                  Exit preview → back to Admin
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setViewAsOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors group"
                >
                  <Eye className="w-4 h-4 text-white/40 group-hover:text-white/70 flex-shrink-0" />
                  <span className="flex-1 text-left">View as…</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${viewAsOpen ? 'rotate-180' : ''}`} />
                </button>
                {viewAsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setViewAsOpen(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md shadow-lg z-20 overflow-hidden">
                      {PREVIEW_ROLES.map(r => (
                        <button
                          key={r.value}
                          onClick={() => activatePreview(r.value)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5 text-white/30" />
                          {r.label}
                        </button>
                      ))}
                      <div className="border-t border-white/10 my-1" />
                      <Link
                        href="/sandbox/interviewer"
                        onClick={() => setViewAsOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <Clapperboard className="w-3.5 h-3.5" />
                        Sandbox — Interviewer
                      </Link>
                      <Link
                        href="/sandbox/hiring-manager"
                        onClick={() => setViewAsOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <Clapperboard className="w-3.5 h-3.5" />
                        Sandbox — Hiring Manager
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="px-3 pb-2 flex-shrink-0">
          <Link
            href="/settings/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
              pathname?.startsWith('/settings')
                ? 'bg-[#4AFFD2]/20 text-[#4AFFD2]'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className={`w-4 h-4 flex-shrink-0 ${pathname?.startsWith('/settings') ? 'text-[#4AFFD2]' : 'text-white/40 group-hover:text-white/70'}`} />
            Settings
          </Link>
        </div>

        {/* User section */}
        <div
          className="border-t border-white/10 px-3 py-3 flex-shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#4AFFD2] text-[#111111] text-xs font-bold flex-shrink-0">
                  {session.user.name?.[0]?.toUpperCase() ?? session.user.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/90 truncate">{session.user.name ?? session.user.email}</p>
                  <p className="text-xs text-white/40 truncate capitalize">{role?.toLowerCase().replace('_', ' ')}{previewRole ? ` · previewing` : ''}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />
              </button>
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 text-white/40" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white">
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
