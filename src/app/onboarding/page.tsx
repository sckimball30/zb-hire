export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { OnboardingTable } from '@/components/onboarding/OnboardingTable'

export default async function OnboardingPage() {
  const records = await prisma.onboardingRecord.findMany({
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <OnboardingTable initialRecords={records} />
    </div>
  )
}
