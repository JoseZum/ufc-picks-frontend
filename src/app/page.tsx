import type { Metadata } from 'next'
import { HomePage } from './HomePage'
import { UI_VERSION } from '../config/uiVersion'
import { LandingPageV2 } from '../components/design-system-v2/pages/LandingPageV2'

export const metadata: Metadata = {
  title: 'UFC Picks - Home',
  description: 'View upcoming UFC events, make your predictions, and track your leaderboard ranking.',
}

export default function Page() {
  if (UI_VERSION === 'v2') {
    return <LandingPageV2 />
  }
  return <HomePage />
}
