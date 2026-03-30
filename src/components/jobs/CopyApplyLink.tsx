'use client'
import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

export function CopyApplyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="flex-1 text-sm text-gray-600 truncate">{url}</p>
      <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] text-white text-xs font-medium hover:bg-gray-800 transition-colors flex-shrink-0">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}
