import type { Metadata } from 'next'
import { EventDetailPage } from './EventDetailPage'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: `${id} - UFC Picks`,
    description: 'View fight card and make your predictions',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventDetailPage id={id} />
}
