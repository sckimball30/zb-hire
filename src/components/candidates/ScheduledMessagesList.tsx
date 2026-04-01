'use client'

import { useState } from 'react'
import { Clock, X } from 'lucide-react'
import { toast } from 'sonner'

type ScheduledMessage = {
  id: string
  subject: string
  scheduledFor: string // ISO string (serialized from server)
  templateName?: string | null
}

interface Props {
  initialMessages: ScheduledMessage[]
}

export function ScheduledMessagesList({ initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)

  async function cancel(id: string) {
    const res = await fetch(`/api/messages/scheduled/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Scheduled message cancelled.')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to cancel scheduled message.')
    }
  }

  if (messages.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-900">Scheduled ({messages.length})</h2>
      </div>
      <ul className="divide-y divide-gray-50">
        {messages.map(msg => {
          const deliveryDate = new Date(msg.scheduledFor)
          const formattedDate = deliveryDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
          return (
            <li key={msg.id} className="px-4 py-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{msg.subject}</p>
                {msg.templateName && (
                  <p className="text-xs text-gray-400 mt-0.5">Template: {msg.templateName}</p>
                )}
                <p className="text-xs text-amber-600 mt-0.5">Delivers: {formattedDate}</p>
              </div>
              <button
                onClick={() => cancel(msg.id)}
                title="Cancel scheduled message"
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
