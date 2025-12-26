import type { Metadata } from 'next'
import { MyPicksPage } from './MyPicksPage'

export const metadata: Metadata = {
  title: 'My Picks - UFC Picks',
  description: 'View and track your fight predictions',
}

export default function Page() {
  return <MyPicksPage />
}
