import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gmail'

export async function GET() {
  try {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[gmail auth]', err)
    return NextResponse.json({ error: 'Gmail not configured' }, { status: 500 })
  }
}
