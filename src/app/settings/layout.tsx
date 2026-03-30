'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Users } from 'lucide-react'

const tabs = [
  { href: '/settings/profile', label: 'My Profile', icon: User },
  { href: '/settings/users', label: 'Team & Users', icon: Users },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Settings sub-nav */}
      <div className="w-48 flex-shrink-0 border-r border-gray-100 bg-white pt-8 px-3">
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
