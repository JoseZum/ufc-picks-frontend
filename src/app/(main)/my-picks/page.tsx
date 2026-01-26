import type { Metadata } from 'next'
import { MyPicksPage } from './MyPicksPage'

export const metadata: Metadata = {
  title: 'My Picks - UFC Picks',
  description: 'View and track your fight predictions',
}

// Force dynamic rendering to avoid SSG/SSR issues with browser APIs
export const dynamic = 'force-dynamic'

export default function Page() {
  return <MyPicksPage />
}
