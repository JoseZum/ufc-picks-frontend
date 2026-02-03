import type { Metadata } from 'next'
import { LeaderboardsPage } from './LeaderboardsPage'
import { UI_VERSION } from '@/config/uiVersion'
import { LeaderboardPageV2 } from '@/components/design-system-v2/pages/LeaderboardPageV2'

export const metadata: Metadata = {
  title: 'Leaderboards - UFC Picks',
  description: 'Compete with other fans and climb the rankings',
}

// Force dynamic rendering to avoid SSG/SSR issues with browser APIs
export const dynamic = 'force-dynamic'

export default function Page() {
  if (UI_VERSION === 'v2') {
    return <LeaderboardPageV2 />
  }
  return <LeaderboardsPage />
}
