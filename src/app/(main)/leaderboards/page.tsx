import type { Metadata } from 'next'
import { LeaderboardsPage } from './LeaderboardsPage'

export const metadata: Metadata = {
  title: 'Leaderboards - UFC Picks',
  description: 'Compete with other fans and climb the rankings',
}

// Force dynamic rendering to avoid SSG/SSR issues with browser APIs
export const dynamic = 'force-dynamic'

export default function Page() {
  return <LeaderboardsPage />
}
