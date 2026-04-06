import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  await prisma.gmailConnection.deleteMany()
  return NextResponse.json({ ok: true })
}
