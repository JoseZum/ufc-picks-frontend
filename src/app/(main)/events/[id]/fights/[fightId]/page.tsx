import type { Metadata } from 'next'
import { FightPickPageV2 } from '@/components/design-system-v2/pages/FightPickPageV2'

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; fightId: string }>
}): Promise<Metadata> {
  const { id, fightId } = await params
  return {
    title: `Fight ${fightId} - ${id} - UFC Picks`,
    description: 'Make your pick for this fight',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string; fightId: string }> }) {
  const { id, fightId } = await params
  return <FightPickPageV2 params={{ id, fightId }} />
}
