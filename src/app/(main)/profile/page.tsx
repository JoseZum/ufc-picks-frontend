import type { Metadata } from 'next'
import { ProfilePageV2 } from '@/components/design-system-v2/pages/ProfilePageV2'

export const metadata: Metadata = {
  title: 'Profile - UFC Picks',
  description: 'Manage your account and view your stats',
}

export const dynamic = 'force-dynamic'

export default function Page() {
  return <ProfilePageV2 />
}
