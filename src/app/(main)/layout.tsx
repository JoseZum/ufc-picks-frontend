import { AppLayout } from '@/components/AppLayout'
import { BottomNav } from '@/components/BottomNav'
import { UI_VERSION } from '@/config/uiVersion'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (UI_VERSION === 'v2') {
    return (
      <>
        {children}
        <BottomNav />
      </>
    )
  }
  return <AppLayout>{children}</AppLayout>
}
