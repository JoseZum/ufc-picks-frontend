'use client';

/**
 * Production mount point for the Home mission block.
 *
 * This is the only mission component the Home page knows about. It owns the
 * gateway, the card context and every non-happy state; `HomeMissions` below it
 * stays a pure renderer of a presentation-ready view model.
 *
 * It computes nothing about missions. Progress, percentages, XP, lock reasons
 * and VOID reasons are read straight out of the view model the gateway
 * returned. The only things decided here are which state to show and when to
 * refetch.
 */

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/api';
import { useEvent, useEventBouts, useMyPicks } from '@/lib/hooks';
import '../missions.css';

import type { MissionOffer, MockSelection } from '../contracts/mission-mock-models';
import type { PickPatchInput } from '../renderers/pick-completion';
import { showSelectionToast } from '../components/mission-celebration';
import {
  MissionsErrorState,
  MissionsLoadingState,
  MissionsLoggedOutState,
  MissionsUnavailableState,
} from '../components/mission-states';
import { createMissionGateway } from '../gateway/create-mission-gateway';
import { MissionGatewayError } from '../gateway/mission-gateway';
import { toCardContext } from '../gateway/mission-api-mappers';
import { HomeMissions } from './home-missions';

export function HomeMissionsSection({ eventId }: { eventId?: number }) {
  const queryClient = useQueryClient();
  const gateway = React.useMemo(() => createMissionGateway(), []);

  // Whether there is a session is only knowable in the browser. Rendering the
  // skeleton until mount keeps the server and first client paint identical
  // instead of flashing the logged-out box at a signed-in user.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const signedIn = mounted && isAuthenticated();

  const id = eventId ?? 0;
  const { data: event } = useEvent(id);
  const {
    data: bouts,
    isError: cardFailed,
    error: cardError,
    refetch: refetchCard,
  } = useEventBouts(id);
  // Shares the cache the picks pages already fill. A mission that writes picks
  // must know which bouts the user has already decided, or it asks them to
  // choose a method they chose days ago.
  const { data: picks } = useMyPicks(id);

  // Same query keys the rest of Home already uses, so this shares their cache
  // rather than issuing a second round of event/bout requests.
  const card = React.useMemo(() => toCardContext(id, event, bouts), [id, event, bouts]);
  const cardReady = id > 0 && bouts !== undefined;

  const missions = useQuery({
    queryKey: ['missions', 'home', id],
    queryFn: () => gateway.getHome({ eventId: id, card }),
    enabled: signedIn && cardReady,
    retry: false,
  });

  const handleSelect = React.useCallback(
    async (
      slot: 1 | 2 | 3,
      offer: MissionOffer,
      selection: MockSelection,
      pickPatches: PickPatchInput[]
    ) => {
      await gateway.select({ eventId: id, slot, offer, selection, pickPatches });
      // A mission with a pick effect can rewrite canonical picks, so both
      // caches are refreshed from the server rather than patched locally.
      await queryClient.invalidateQueries({ queryKey: ['missions', 'home', id] });
      await queryClient.invalidateQueries({ queryKey: ['myPicks'] });
      showSelectionToast(offer.name, offer.xp);
    },
    [gateway, id, queryClient]
  );

  if (!mounted) return <MissionsLoadingState />;
  if (!signedIn) return <MissionsLoggedOutState />;
  if (id <= 0) return <MissionsUnavailableState />;

  // El bloque no puede pedir misiones sin la cartelera, así que la consulta de
  // misiones queda deshabilitada mientras `bouts` sea undefined. Si esa
  // petición FALLA, undefined es para siempre: la sección se quedaba en
  // esqueleto sin decir nunca que algo reventó ni dar forma de reintentar.
  if (cardFailed) {
    return (
      <MissionsErrorState
        message={
          cardError instanceof Error
            ? cardError.message
            : 'The card for this event could not be loaded.'
        }
        onRetry={() => void refetchCard()}
      />
    );
  }

  if (!cardReady || missions.isPending) return <MissionsLoadingState />;

  if (missions.isError) {
    const error = missions.error;
    if (error instanceof MissionGatewayError) {
      if (error.code === 'UNAUTHENTICATED') return <MissionsLoggedOutState />;
      if (error.code === 'NOT_AVAILABLE') {
        return <MissionsUnavailableState message={error.message} />;
      }
    }
    return (
      <MissionsErrorState
        message={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={() => void missions.refetch()}
      />
    );
  }

  // The card is re-attached from the live event/bout caches so the drawer's
  // pickers always describe the fights currently on the card.
  return (
    <HomeMissions
      state={{ ...missions.data, event: card }}
      picks={picks}
      onSelect={handleSelect}
    />
  );
}
