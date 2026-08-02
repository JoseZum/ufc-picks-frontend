import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TypesLab } from '@/features/missions/lab/types-lab'

export const metadata: Metadata = {
  title: 'Mission Types (dev)',
  robots: { index: false, follow: false },
}

/**
 * Development-only page showing every mission interaction shape at once
 * (FE-000A review aid). Same guard as /mission-lab.
 */
export default function Page() {
  const enabled =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_MISSION_LAB === 'true'

  if (!enabled) notFound()

  return <TypesLab />
}
