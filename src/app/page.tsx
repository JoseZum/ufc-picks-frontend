import type { Metadata } from 'next'
import { LandingPageV2 } from '../components/design-system-v2/pages/LandingPageV2'

export const metadata: Metadata = {
  title: 'UFC Picks - Home',
  description: 'View upcoming UFC events, make your predictions, and track your leaderboard ranking.',
}

export default function Page() {
  return <LandingPageV2 />
}
