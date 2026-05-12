'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Users, Zap, Plug, Building2 } from 'lucide-react'

const tabs = [
  { href: '/settings/company', label: 'Company', icon: Building2 },
  { href: '/settings/profile', label: 'My Profile', icon: User },
  { href: '/settings/users', label: 'Team & Users', icon: Users },
  { href: '/settings/automations', label: 'Automations', icon: Zap },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile: horizontal scrollable tab bar */}
      <div className="md:hidden flex-shrink-0 border-b border-gray-100 bg-white">
        <nav className="flex overflow-x-auto scrollbar-none px-2">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                  active
                    ? 'border-[#111] text-[#111]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Desktop: left sidebar */}
      <div className="hidden md:block w-48 flex-shrink-0 border-r border-gray-100 bg-white pt-8 px-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-3">Settings</p>
        <nav className="space-y-0.5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#4AFFD2]/15 text-[#111]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
