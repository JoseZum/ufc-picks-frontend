import type { Metadata } from 'next'
import { ProfilePage } from './ProfilePage'

export const metadata: Metadata = {
  title: 'Profile - UFC Picks',
  description: 'Manage your account and view your stats',
}

// Force dynamic rendering to avoid SSG/SSR issues with browser APIs
export const dynamic = 'force-dynamic'

export default function Page() {
  return <ProfilePage />
}
