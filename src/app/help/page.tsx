export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HelpClient } from '@/components/help/HelpClient'

export default async function HelpPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const role = (session.user as any)?.role as string ?? 'RECRUITER'

  return <HelpClient role={role} userName={session.user?.name ?? session.user?.email ?? ''} />
}
