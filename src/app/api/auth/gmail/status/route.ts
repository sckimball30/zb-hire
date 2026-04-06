import { NextResponse } from 'next/server'
import { getGmailStatus } from '@/lib/gmail'

export async function GET() {
  const status = await getGmailStatus()
  return NextResponse.json(status)
}
