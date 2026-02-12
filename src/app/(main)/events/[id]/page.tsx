import type { Metadata } from 'next'
import { EventDetailPageV2 } from '@/components/design-system-v2/pages/EventDetailPageV2'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: `${id} - UFC Picks`,
    description: 'View fight card and make your predictions',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventDetailPageV2 params={{ id }} />
}
