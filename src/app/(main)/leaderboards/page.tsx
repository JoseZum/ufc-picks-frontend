import type { Metadata } from 'next'
import { LeaderboardPageV2 } from '@/components/design-system-v2/pages/LeaderboardPageV2'

export const metadata: Metadata = {
  title: 'Leaderboards - UFC Picks',
  description: 'Compete with other fans and climb the rankings',
}

export const dynamic = 'force-dynamic'

export default function Page() {
  return <LeaderboardPageV2 />
}
