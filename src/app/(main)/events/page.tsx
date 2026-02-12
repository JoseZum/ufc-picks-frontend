import type { Metadata } from 'next'
import { EventsPageV2 } from '@/components/design-system-v2/pages/EventsPageV2'

export const metadata: Metadata = {
  title: 'Events - UFC Picks',
  description: 'Browse upcoming and completed UFC events',
}

export default function Page() {
  return <EventsPageV2 />
}
