import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getOAuth2Client } from '@/lib/gmail'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?gmail=error`
    )
  }

  try {
    const client = getOAuth2Client()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get the Gmail address
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userInfo } = await oauth2.userinfo.get()
    const email = userInfo.email!

    // Upsert — only one connection supported
    const existing = await prisma.gmailConnection.findFirst()
    if (existing) {
      await prisma.gmailConnection.update({
        where: { id: existing.id },
        data: {
          email,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token ?? existing.refreshToken,
          expiresAt: new Date(tokens.expiry_date!),
        },
      })
    } else {
      await prisma.gmailConnection.create({
        data: {
          email,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token!,
          expiresAt: new Date(tokens.expiry_date!),
        },
      })
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?gmail=connected`
    )
  } catch (err) {
    console.error('[gmail callback]', err)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?gmail=error`
    )
  }
}
