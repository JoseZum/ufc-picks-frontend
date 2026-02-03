import type { Metadata } from 'next'
import { MyPicksPage } from './MyPicksPage'
import { UI_VERSION } from '@/config/uiVersion'
import { PicksPageV2 } from '@/components/design-system-v2/pages/PicksPageV2'

export const metadata: Metadata = {
  title: 'My Picks - UFC Picks',
  description: 'View and track your fight predictions',
}

// Force dynamic rendering to avoid SSG/SSR issues with browser APIs
export const dynamic = 'force-dynamic'

export default function Page() {
  if (UI_VERSION === 'v2') {
    return <PicksPageV2 />
  }
  return <MyPicksPage />
}
