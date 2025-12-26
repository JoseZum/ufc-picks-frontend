import type { Metadata } from 'next'
import { LeaderboardsPage } from './LeaderboardsPage'

export const metadata: Metadata = {
  title: 'Leaderboards - UFC Picks',
  description: 'Compete with other fans and climb the rankings',
}

export default function Page() {
  return <LeaderboardsPage />
}
