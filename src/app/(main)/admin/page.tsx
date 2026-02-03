import type { Metadata } from 'next'
import { AdminPage } from './AdminPage'
import { UI_VERSION } from '@/config/uiVersion'
import { AdminPageV2 } from '@/components/design-system-v2/pages/AdminPageV2'

export const metadata: Metadata = {
  title: 'Admin Panel - UFC Picks',
  description: 'Panel de administración para gestionar eventos y resultados',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function Page() {
  if (UI_VERSION === 'v2') {
    return <AdminPageV2 />
  }
  return <AdminPage />
}
