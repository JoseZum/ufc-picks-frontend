import type { Metadata } from 'next'
import { FightPage } from './FightPage'

export async function generateMetadata({
  params
}: {
  params: { id: string; fightId: string }
}): Promise<Metadata> {
  return {
    title: `Fight ${params.fightId} - ${params.id} - UFC Picks`,
    description: 'Make your pick for this fight',
  }
}

export default function Page({ params }: { params: { id: string; fightId: string } }) {
  return <FightPage eventId={params.id} fightId={params.fightId} />
}
