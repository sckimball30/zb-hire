'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, RefreshCw, User, ChevronRight, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { initials, timeAgo, stripEmailQuote } from '@/lib/utils'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Message {
  id: string
  subject: string
  body: string
  sentAt: string
  direction: string
  sentByName: string | null
  read: boolean
  gmailThreadId: string | null
}

interface Conversation {
  candidateId: string
  candidate: Candidate
  lastMessage: {
    subject: string
    body: string
    sentAt: string
    direction: string
    sentByName: string | null
  }
  unreadCount: number
}

interface Props {
  initialConversations: Conversation[]
}

export function InboxClient({ initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<{ candidate: Candidate; messages: Message[] } | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const threadEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadThread = useCallback(async (candidateId: string) => {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/inbox/${candidateId}`)
      if (!res.ok) throw new Error('Failed to load thread')
      const data = await res.json()
      setThread(data)
      setConversations(prev =>
        prev.map(c => c.candidateId === candidateId ? { ...c, unreadCount: 0 } : c)
      )
    } catch {
      toast.error('Could not load conversation')
    } finally {
      setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) loadThread(selectedId)
  }, [selectedId, loadThread])

  useEffect(() => {
    if (thread) setTimeout(scrollToBottom, 100)
  }, [thread, scrollToBottom])

  function selectConversation(candidateId: string) {
    setSelectedId(candidateId)
    setThread(null)
    setReplyBody('')
    setMobileView('thread')
  }

  async function handleSend() {
    if (!selectedId || !replyBody.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/inbox/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Send failed')
      }
      const { message } = await res.json()
      setThread(prev => prev ? { ...prev, messages: [...prev.messages, message] } : prev)
      setReplyBody('')
      setConversations(prev =>
        prev.map(c => c.candidateId === selectedId
          ? { ...c, lastMessage: { subject: message.subject, body: message.body, sentAt: message.sentAt, direction: message.direction, sentByName: message.sentByName } }
          : c
        )
      )
      setTimeout(scrollToBottom, 100)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedConv = conversations.find(c => c.candidateId === selectedId)
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const q = search.trim().toLowerCase()
  const filtered = q
    ? conversations.filter(c =>
        `${c.candidate.firstName} ${c.candidate.lastName}`.toLowerCase().includes(q) ||
        c.candidate.email.toLowerCase().includes(q) ||
        c.lastMessage.subject?.toLowerCase().includes(q) ||
        c.lastMessage.body?.toLowerCase().includes(q)
      )
    : conversations

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list */}
      <div className={`flex flex-col border-r border-gray-200 bg-white flex-shrink-0 w-full md:w-80 lg:w-96 ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900">Inbox</h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-8 py-2 text-sm bg-gray-100 border-0 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages sent to candidates will appear here.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <Search className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-600">No results for "{search}"</p>
              <button onClick={() => setSearch('')} className="text-xs text-blue-600 hover:underline mt-2">Clear search</button>
            </div>
          ) : (
            filtered.map(conv => {
              const isSelected = conv.candidateId === selectedId
              const isUnread = conv.unreadCount > 0
              return (
                <button
                  key={conv.candidateId}
                  onClick={() => selectConversation(conv.candidateId)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isUnread ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {initials(conv.candidate.firstName, conv.candidate.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {conv.candidate.firstName} {conv.candidate.lastName}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {timeAgo(new Date(conv.lastMessage.sentAt))}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {conv.lastMessage.direction === 'OUTBOUND' ? 'You: ' : ''}
                      {stripEmailQuote(conv.lastMessage.body).slice(0, 60)}
                    </p>
                    {isUnread && (
                      <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1 md:hidden" />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Thread panel */}
      <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-600">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-1">Choose a candidate from the list to view messages</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {selectedConv && (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                    {initials(selectedConv.candidate.firstName, selectedConv.candidate.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedConv.candidate.firstName} {selectedConv.candidate.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{selectedConv.candidate.email}</p>
                  </div>
                  <Link href={`/candidates/${selectedConv.candidateId}`} className="text-xs text-blue-600 hover:underline flex-shrink-0 hidden sm:block">
                    View Profile
                  </Link>
                </>
              )}
              <button
                onClick={() => loadThread(selectedId)}
                disabled={loadingThread}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingThread ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingThread ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !thread || thread.messages.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">No messages yet</div>
              ) : (
                thread.messages.map(msg => {
                  // Treat as inbound if direction is INBOUND, or if the sender
                  // name/email matches the candidate (catches old mis-tagged records)
                  const candidateEmail = thread.candidate.email.toLowerCase()
                  const isOutbound = msg.direction === 'OUTBOUND' &&
                    !msg.sentByName?.toLowerCase().includes(candidateEmail)
                  return (
                    <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      {!isOutbound && thread?.candidate && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mr-2 mt-auto mb-5">
                          {initials(thread.candidate.firstName, thread.candidate.lastName)}
                        </div>
                      )}
                      <div className={`max-w-[75%] flex flex-col gap-1 ${isOutbound ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isOutbound ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                          {stripEmailQuote(msg.body)}
                        </div>
                        <p className={`text-xs text-gray-400 px-1 ${isOutbound ? 'text-right' : 'text-left'}`}>
                          {isOutbound ? (msg.sentByName ?? 'You') : thread.candidate.firstName}
                          {' · '}
                          {timeAgo(new Date(msg.sentAt))}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Reply box */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a reply…"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !replyBody.trim()}
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">⌘↵ to send</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
