import type { Metadata } from 'next'
import { HomePage } from './HomePage'

export const metadata: Metadata = {
  title: 'UFC Picks - Home',
  description: 'View upcoming UFC events, make your predictions, and track your leaderboard ranking.',
}

export default function Page() {
  return <HomePage />
}
