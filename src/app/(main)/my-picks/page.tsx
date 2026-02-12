import type { Metadata } from 'next'
import { PicksPageV2 } from '@/components/design-system-v2/pages/PicksPageV2'

export const metadata: Metadata = {
  title: 'My Picks - UFC Picks',
  description: 'View and track your fight predictions',
}

export const dynamic = 'force-dynamic'

export default function Page() {
  return <PicksPageV2 />
}
