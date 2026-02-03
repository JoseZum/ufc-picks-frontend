import { AppLayout } from '@/components/AppLayout'
import { UI_VERSION } from '@/config/uiVersion'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (UI_VERSION === 'v2') {
    return <>{children}</>
  }
  return <AppLayout>{children}</AppLayout>
}
