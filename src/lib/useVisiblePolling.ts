'use client'

import { useEffect, useRef } from 'react'

/**
 * Runs `callback` on an interval, but only while the tab is visible.
 *
 * Neon suspends idle compute after ~5 minutes. A background tab that keeps
 * polling never lets that happen, so a single forgotten tab can burn the
 * whole monthly compute quota. Pausing on hidden tabs lets the database
 * actually go to sleep.
 */
export function useVisiblePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true
) {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const start = () => {
      if (timer) return
      timer = setInterval(() => saved.current(), intervalMs)
    }

    const sync = () => {
      if (document.visibilityState === 'visible') {
        saved.current()
        start()
      } else {
        stop()
      }
    }

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      stop()
    }
  }, [intervalMs, enabled])
}
