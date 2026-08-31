'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react'

/**
 * Renders a resume inline.
 *
 * PDFs go straight into an iframe — browsers have a built-in viewer. Word
 * documents don't have one, and pointing an iframe at a .docx makes the
 * browser download the file instead of showing it. So .docx is fetched and
 * converted to HTML in the browser instead. Legacy .doc is a binary format
 * that can't be converted client-side, so it falls back to an explicit card
 * rather than silently downloading.
 */

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'HR', 'DIV', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'IMG', 'SUP', 'SUB', 'PRE', 'CODE',
])

/** Whitelist tags and attributes — the source document is candidate-supplied. */
function sanitize(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    if (!ALLOWED_TAGS.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes))
      continue
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      const keep =
        (name === 'href' && /^(https?:|mailto:)/i.test(value)) ||
        (name === 'src' && /^data:image\//i.test(value)) ||
        name === 'colspan' ||
        name === 'rowspan' ||
        name === 'alt'
      if (!keep) el.removeAttribute(attr.name)
    }
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
  }

  return doc.body.innerHTML
}

function extensionOf(url: string): 'pdf' | 'docx' | 'doc' | 'other' {
  const clean = url.toLowerCase().split('?')[0]
  if (clean.endsWith('.pdf')) return 'pdf'
  if (clean.endsWith('.docx')) return 'docx'
  if (clean.endsWith('.doc')) return 'doc'
  return 'other'
}

interface Props {
  candidateId: string
  resumeUrl: string
  /** Fixed pixel height. Ignored when variant is 'fill'. */
  height?: number
  /**
   * 'card' — fixed height. 'fill' — fills its flex parent.
   */
  variant?: 'card' | 'fill'
  /**
   * Hide below the md breakpoint. True where the page already renders its own
   * mobile "View resume" link; false where the preview is the only affordance.
   */
  hideOnMobile?: boolean
}

export function ResumePreview({
  candidateId,
  resumeUrl,
  height = 700,
  variant = 'card',
  hideOnMobile = true,
}: Props) {
  const kind = extensionOf(resumeUrl)
  const isFill = variant === 'fill'
  const shellClass = isFill
    ? 'flex-1 w-full min-h-0'
    : `${hideOnMobile ? 'hidden md:block' : 'block'} w-full`
  const shellStyle = isFill ? undefined : { height }
  const centeredClass = isFill
    ? 'flex-1 w-full min-h-0 flex items-center justify-center'
    : `${hideOnMobile ? 'hidden md:flex' : 'flex'} w-full items-center justify-center`
  const [html, setHtml] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(kind === 'docx')

  useEffect(() => {
    if (kind !== 'docx') return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setFailed(false)
      setHtml(null)
      try {
        const res = await fetch(`/api/resume/${candidateId}?raw=1`)
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        const buffer = await res.arrayBuffer()

        // Loaded on demand so the ~600KB converter only ships to people
        // actually opening a Word resume.
        const mod: any = await import('mammoth/mammoth.browser')
        const mammoth = mod.default ?? mod

        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        if (cancelled) return

        const clean = sanitize(result.value ?? '')
        if (!clean.trim()) throw new Error('Converted document was empty')
        setHtml(clean)
      } catch (err) {
        console.error('[ResumePreview] Could not render Word document:', err)
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [candidateId, resumeUrl, kind])

  const cacheKey = encodeURIComponent(resumeUrl.slice(-12))

  // PDFs (and anything unrecognized that the browser may still handle)
  if (kind === 'pdf' || kind === 'other') {
    return (
      <div className={`${shellClass} bg-gray-50`} style={shellStyle}>
        <iframe
          key={resumeUrl}
          src={`/api/resume/${candidateId}?v=${cacheKey}`}
          className="w-full h-full border-0"
          title="Resume"
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`${centeredClass} bg-gray-50`} style={shellStyle}>
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm">Rendering document…</p>
        </div>
      </div>
    )
  }

  if (html) {
    return (
      <div className={`${shellClass} bg-gray-50 overflow-y-auto`} style={shellStyle}>
        <div className="mx-auto my-6 max-w-3xl bg-white shadow-sm border border-gray-200 rounded-lg px-6 py-7 lg:px-10 lg:py-9">
          <div className="resume-doc" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    )
  }

  // Legacy .doc, or conversion failed — offer the file explicitly instead of
  // letting the browser download it unasked.
  return (
    <div className={`${centeredClass} bg-gray-50`} style={shellStyle}>
      <div className="text-center max-w-sm px-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mx-auto mb-4">
          {failed
            ? <AlertCircle className="w-6 h-6 text-gray-400" />
            : <FileText className="w-6 h-6 text-gray-400" />}
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          {failed ? "This document couldn't be rendered" : 'Preview not available'}
        </p>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          {kind === 'doc'
            ? 'This is a legacy .doc file, which browsers cannot display. Open or download it to read it.'
            : 'The file may be corrupted or password-protected.'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <a
            href={`/api/resume/${candidateId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in new tab
          </a>
          <a
            href={`/api/resume/${candidateId}?download=1`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
