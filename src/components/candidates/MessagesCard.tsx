'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, Send, Clock, RefreshCw, ArrowDownLeft } from 'lucide-react'
import { toast } from 'sonner'
import { stripEmailQuote } from '@/lib/utils'

interface MessageEntry {
  id: string
  subject: string
  body: string
  sentAt: string
  sentByName: string | null
  direction: string
  gmailThreadId: string | null
  kind?: 'sent' | 'scheduled'
  scheduledFor?: string
}

interface Props {
  candidateId: string
  initialMessages: MessageEntry[]
  scheduledMessages: MessageEntry[]
  gmailConnected: boolean
}

export function MessagesCard({ candidateId, initialMessages, scheduledMessages, gmailConnected }: Props) {
  const [messages, setMessages] = useState<MessageEntry[]>(initialMessages)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const hasThreads = messages.some(m => m.gmailThreadId)

  const syncReplies = useCallback(async (silent = false) => {
    if (!gmailConnected || !hasThreads) return
    if (!silent) setSyncing(true)
    try {
      const res = await fetch('/api/messages/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      setMessages(data.messages)
      setLastSynced(new Date())
      if (!silent && data.newCount > 0) {
        toast.success(`${data.newCount} new repl${data.newCount === 1 ? 'y' : 'ies'} from candidate`)
      }
    } catch (err) {
      if (!silent) toast.error('Could not sync replies')
    } finally {
      setSyncing(false)
    }
  }, [candidateId, gmailConnected, hasThreads])

  // Auto-sync on mount when Gmail is connected and there are threads to check
  useEffect(() => {
    if (gmailConnected && hasThreads) {
      syncReplies(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allItems = [
    ...messages.map(m => ({ ...m, kind: 'log' as const })),
    ...scheduledMessages.map(m => ({ ...m, kind: 'scheduled' as const })),
  ].sort((a, b) => {
    const aDate = new Date(a.kind === 'scheduled' ? (a.scheduledFor ?? a.sentAt) : a.sentAt).getTime()
    const bDate = new Date(b.kind === 'scheduled' ? (b.scheduledFor ?? b.sentAt) : b.sentAt).getTime()
    return aDate - bDate
  })

  const inboundCount = messages.filter(m => m.direction === 'INBOUND').length

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Mail className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">Messages</h3>
        {allItems.length > 0 && (
          <span className="ml-1 text-xs text-gray-400">{allItems.length}</span>
        )}
        {inboundCount > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <ArrowDownLeft className="w-2.5 h-2.5" />
            {inboundCount} repl{inboundCount === 1 ? 'y' : 'ies'}
          </span>
        )}
        {gmailConnected && hasThreads && (
          <button
            onClick={() => syncReplies(false)}
            disabled={syncing}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            title={lastSynced ? `Last synced ${lastSynced.toLocaleTimeString()}` : 'Sync replies'}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        )}
      </div>

      {allItems.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <Mail className="w-6 h-6 text-gray-200 mx-auto mb-1.5" />
          <p className="text-xs text-gray-400">No messages sent yet.</p>
          {!gmailConnected && (
            <a href="/settings/integrations" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
              Connect Gmail to track replies →
            </a>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {allItems.map((msg) => {
            const isInbound = msg.kind === 'log' && msg.direction === 'INBOUND'
            const isScheduled = msg.kind === 'scheduled'
            const isOpen = expanded.has(msg.id)
            const dateStr = isScheduled
              ? new Date(msg.scheduledFor!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date(msg.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

            return (
              <li
                key={msg.id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isInbound ? 'bg-blue-50/30' : ''}`}
                onClick={() => toggleExpand(msg.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {isScheduled ? (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ) : isInbound ? (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${isInbound ? 'text-blue-800' : 'text-gray-800'}`}>
                        {msg.subject || '(no subject)'}
                      </p>
                      {!isScheduled && <span className="text-xs text-gray-400 flex-shrink-0">{dateStr}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isScheduled ? (
                        <span className="text-amber-500">Scheduled for {dateStr}</span>
                      ) : isInbound ? (
                        <span className="text-blue-600 font-medium">Candidate reply</span>
                      ) : (
                        msg.sentByName ?? 'Sent'
                      )}
                    </p>

                    {isOpen && (
                      <div className="mt-2 text-xs text-gray-600 bg-white rounded border border-gray-100 p-2.5 whitespace-pre-wrap leading-relaxed">
                        {stripEmailQuote(msg.body)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0 mt-0.5">
                    {isOpen ? '▾' : '▸'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {gmailConnected && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Gmail connected — replies sync automatically
          </p>
        </div>
      )}
    </div>
  )
}
