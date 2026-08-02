import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MissionLab } from '@/features/missions/lab/mission-lab'

export const metadata: Metadata = {
  title: 'Mission Lab (dev)',
  robots: { index: false, follow: false },
}

/**
 * Development-only prototype route (FE-000A). It 404s in any non-development
 * build unless NEXT_PUBLIC_ENABLE_MISSION_LAB is explicitly turned on, so a
 * production deploy never exposes the mock surfaces.
 */
export default function Page() {
  const enabled =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_MISSION_LAB === 'true'

  if (!enabled) notFound()

  return <MissionLab />
}
