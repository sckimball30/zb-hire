import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const COOKIE = 'zbhire_preview_role'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { role } = await req.json()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, role, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 8 })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
