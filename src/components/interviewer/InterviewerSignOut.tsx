'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function InterviewerSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/login' })}
      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign out
    </button>
  )
}
