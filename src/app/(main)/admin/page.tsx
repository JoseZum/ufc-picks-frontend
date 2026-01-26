import type { Metadata } from 'next'
import { AdminPage } from './AdminPage'

export const metadata: Metadata = {
  title: 'Admin Panel - UFC Picks',
  description: 'Panel de administración para gestionar eventos y resultados',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function Page() {
  return <AdminPage />
}
