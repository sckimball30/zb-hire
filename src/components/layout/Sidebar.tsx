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
  Settings,
  LogOut,
  ChevronDown,
  BarChart2,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/questions', label: 'Questions', icon: HelpCircle },
  { href: '/interviewers', label: 'Interviewers', icon: UserCheck },
  { href: '/messages/templates', label: 'Messages', icon: Mail },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAuthPage = pathname?.startsWith('/auth')
  const isPublicPage = pathname?.startsWith('/apply') || pathname?.startsWith('/offers')
  if (isAuthPage || isPublicPage) return null

  return (
    <aside className="flex flex-col w-60 bg-[#111111] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white/10 flex-shrink-0">
          <span className="text-white font-black text-base tracking-tighter leading-none">ZB</span>
        </div>
        <div className="min-w-0">
          <span className="text-white font-bold text-base leading-tight block">ZB Hire</span>
          <span className="text-white/40 text-xs leading-tight">by ZB Designs</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                active
                  ? 'bg-[#4AFFD2]/20 text-[#4AFFD2]'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#4AFFD2]' : 'text-white/40 group-hover:text-white/70'}`}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Settings link */}
      <div className="px-3 pb-2">
        <Link
          href="/settings/users"
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
      <div className="border-t border-white/10 px-3 py-3">
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
                <p className="text-xs text-white/40 truncate capitalize">{(session.user as any).role?.toLowerCase()}</p>
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
          <Link
            href="/auth/login"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  )
}
