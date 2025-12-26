import type { Metadata } from 'next'
import { EventDetailPage } from './EventDetailPage'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `${params.id} - UFC Picks`,
    description: 'View fight card and make your predictions',
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <EventDetailPage id={params.id} />
}
