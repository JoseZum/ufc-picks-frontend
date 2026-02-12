import type { Metadata } from 'next'
import { AdminPageV2 } from '@/components/design-system-v2/pages/AdminPageV2'

export const metadata: Metadata = {
  title: 'Admin Panel - UFC Picks',
  description: 'Panel de administración para gestionar eventos y resultados',
}

export const dynamic = 'force-dynamic'

export default function Page() {
  return <AdminPageV2 />
}
