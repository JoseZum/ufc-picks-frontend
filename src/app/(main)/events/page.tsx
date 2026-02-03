import type { Metadata } from 'next'
import { EventsPage } from './EventsPage'
import { UI_VERSION } from '@/config/uiVersion'
import { EventsPageV2 } from '@/components/design-system-v2/pages/EventsPageV2'

export const metadata: Metadata = {
  title: 'Events - UFC Picks',
  description: 'Browse upcoming and completed UFC events',
}

export default function Page() {
  if (UI_VERSION === 'v2') {
    return <EventsPageV2 />
  }
  return <EventsPage />
}
