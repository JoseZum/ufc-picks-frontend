import type { Metadata } from 'next'
import { ProfilePage } from './ProfilePage'

export const metadata: Metadata = {
  title: 'Profile - UFC Picks',
  description: 'Manage your account and view your stats',
}

export default function Page() {
  return <ProfilePage />
}
