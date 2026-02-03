import type { Metadata } from 'next'
import { ProfilePage } from './ProfilePage'
import { UI_VERSION } from '@/config/uiVersion'
import { ProfilePageV2 } from '@/components/design-system-v2/pages/ProfilePageV2'

export const metadata: Metadata = {
  title: 'Profile - UFC Picks',
  description: 'Manage your account and view your stats',
}

// Force dynamic rendering to avoid SSG/SSR issues with browser APIs
export const dynamic = 'force-dynamic'

export default function Page() {
  if (UI_VERSION === 'v2') {
    return <ProfilePageV2 />
  }
  return <ProfilePage />
}
