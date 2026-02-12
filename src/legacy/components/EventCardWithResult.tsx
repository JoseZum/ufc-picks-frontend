import { EventCard } from "./EventCard";
import { useEventBouts } from "@/lib/hooks";
import { getEventPosterUrl } from "@/lib/api";
import type { Event } from "@/lib/api";

interface EventCardWithResultProps {
  event: Event;
  date: string;
  location: string;
  isUpcoming: boolean;
  onClick?: () => void;
}

export function EventCardWithResult({
  event,
  date,
  location,
  isUpcoming,
  onClick
}: EventCardWithResultProps) {
  // Only fetch bouts for completed events
  const { data: bouts } = useEventBouts(event.id, {
    enabled: event.status === 'completed'
  });

  // Get main event (first bout) with result
  const mainEvent = bouts?.[0];
  const mainEventData = mainEvent ? {
    fighterRed: mainEvent.fighters.red?.fighter_name || 'TBD',
    fighterBlue: mainEvent.fighters.blue?.fighter_name || 'TBD',
    winner: mainEvent.result?.winner === 'red'
      ? mainEvent.fighters.red?.fighter_name
      : mainEvent.result?.winner === 'blue'
      ? mainEvent.fighters.blue?.fighter_name
      : undefined,
    method: mainEvent.result?.method,
    round: mainEvent.result?.round
  } : undefined;

  return (
    <EventCard
      id={String(event.id)}
      name={event.name}
      date={date}
      location={location}
      isUpcoming={isUpcoming}
      status={event.status as "scheduled" | "completed" | "cancelled"}
      fightsCount={event.total_bouts}
      posterUrl={getEventPosterUrl(event)}
      mainEvent={mainEventData}
      onClick={onClick}
    />
  );
}
