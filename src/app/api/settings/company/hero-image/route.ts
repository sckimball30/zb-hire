import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fd = await req.formData()
  const file = fd.get('file') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB2_READ_WRITE_TOKEN
  const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')
  const buffer = Buffer.from(await file.arrayBuffer())
  const blob = await put(`careers-hero/${Date.now()}-${safeName}`, buffer, {
    access: 'public',
    token,
    contentType: file.type || 'application/octet-stream',
  })

  return NextResponse.json({ url: blob.url })
}
