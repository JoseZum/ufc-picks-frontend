import type { Metadata } from 'next'
import { EventsPage } from './EventsPage'

export const metadata: Metadata = {
  title: 'Events - UFC Picks',
  description: 'Browse upcoming and completed UFC events',
}

export default function Page() {
  return <EventsPage />
}
