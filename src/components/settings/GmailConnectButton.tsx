'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  connected: boolean
}

export function GmailConnectButton({ connected }: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    if (!confirm('Disconnect Gmail? Messages will fall back to SMTP and reply syncing will stop.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/auth/gmail/disconnect', { method: 'POST' })
      toast.success('Gmail disconnected.')
      router.refresh()
    } catch {
      toast.error('Failed to disconnect.')
    } finally {
      setDisconnecting(false)
    }
  }

  if (connected) {
    return (
      <button
        onClick={handleDisconnect}
        disabled={disconnecting}
        className="flex-shrink-0 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {disconnecting ? 'Disconnecting…' : 'Disconnect'}
      </button>
    )
  }

  return (
    <a
      href="/api/auth/gmail"
      className="flex-shrink-0 btn-primary text-sm"
    >
      Connect Gmail
    </a>
  )
}
