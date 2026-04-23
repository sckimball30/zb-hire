'use client'

/**
 * Renders plain-text notes that may contain Granola-style markdown:
 *   ### Section Header
 *   - bullet item
 *   Regular paragraph text
 *
 * No external dependency — intentionally lightweight.
 */

interface Props {
  text: string
  className?: string
}

export function NotesRenderer({ text, className = '' }: Props) {
  if (!text?.trim()) return null

  const lines = text.split('\n')

  // Group consecutive '-' lines into a single <ul>
  const blocks: React.ReactNode[] = []
  let bulletBuffer: string[] = []
  let key = 0

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return
    blocks.push(
      <ul key={key++} className="list-disc list-outside ml-4 space-y-0.5 my-1">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="text-sm text-gray-700 leading-relaxed">
            {b}
          </li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('### ')) {
      flushBullets()
      blocks.push(
        <p key={key++} className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-3 mb-1 first:mt-0">
          {line.replace(/^###\s*/, '')}
        </p>
      )
    } else if (line.startsWith('## ')) {
      flushBullets()
      blocks.push(
        <p key={key++} className="text-sm font-semibold text-gray-800 mt-3 mb-1 first:mt-0">
          {line.replace(/^##\s*/, '')}
        </p>
      )
    } else if (line.startsWith('# ')) {
      flushBullets()
      blocks.push(
        <p key={key++} className="text-base font-bold text-gray-900 mt-3 mb-1 first:mt-0">
          {line.replace(/^#\s*/, '')}
        </p>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      bulletBuffer.push(line.replace(/^[-*]\s*/, ''))
    } else if (line.trim() === '') {
      flushBullets()
      // blank lines become a small gap — don't add an actual element
    } else {
      flushBullets()
      blocks.push(
        <p key={key++} className="text-sm text-gray-700 leading-relaxed">
          {line}
        </p>
      )
    }
  }

  flushBullets()

  return (
    <div className={`space-y-0.5 ${className}`}>
      {blocks}
    </div>
  )
}
