export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { GmailConnectButton } from '@/components/settings/GmailConnectButton'
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { gmail?: string }
}) {
  const gmailConn = await prisma.gmailConnection.findFirst()

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Integrations</h1>
      <p className="text-sm text-gray-500 mb-8">Connect external services to ZB Hire.</p>

      {searchParams.gmail === 'connected' && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Gmail connected successfully! Replies from candidates will now sync automatically.
        </div>
      )}
      {searchParams.gmail === 'error' && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Something went wrong connecting Gmail. Please try again.
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Gmail</h2>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                Connect a Gmail account to send messages directly from ZB Hire and automatically
                capture candidate replies in the candidate profile.
              </p>
              {gmailConn && (
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">{gmailConn.email}</span>
                </div>
              )}
              {!gmailConn && (
                <p className="text-xs text-gray-400 mt-2">
                  Currently using SMTP fallback — replies are not tracked.
                </p>
              )}
            </div>
          </div>

          <GmailConnectButton connected={!!gmailConn} />
        </div>
      </div>
    </div>
  )
}
