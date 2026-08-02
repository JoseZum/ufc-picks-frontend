'use client';

/**
 * Slice 3 — the Profile Mission Hub against the real API.
 *
 * The hub itself is presentational: it renders a `ProfileMissionHubVM` and
 * nothing else. This container owns the states that surround it — loading,
 * signed out, error, and the empty profile of a user who has not played yet —
 * plus celebration acknowledgement, which must refresh the hub so an
 * acknowledged celebration does not come back on the next render.
 */

import React from 'react';
import { CelebrationLayer } from '../components/mission-celebration';
import {
  MissionsErrorState,
  MissionsLoadingState,
  MissionsLoggedOutState,
  MissionsUnavailableState,
} from '../components/mission-states';
import type { ProfileMissionHubVM } from '../contracts/mission-mock-models';
import { createHttpMissionGateway } from '../gateway/http-mission-gateway';
import type { MissionGateway } from '../gateway/mission-gateway';
import { ProfileMissionHub } from './profile-mission-hub';

type Phase =
  | { status: 'loading' }
  | { status: 'ready'; hub: ProfileMissionHubVM }
  | { status: 'error'; message: string };

export interface ProfileMissionHubContainerProps {
  /** Absent means signed out — the hub is account-scoped, so it does not load. */
  isAuthenticated: boolean;
  userName: string;
  memberSince: string;
  /** Injected in tests; production builds the HTTP adapter. */
  gateway?: MissionGateway;
}

export function ProfileMissionHubContainer({
  isAuthenticated,
  userName,
  memberSince,
  gateway,
}: ProfileMissionHubContainerProps) {
  const resolved = React.useMemo(
    () =>
      gateway ??
      createHttpMissionGateway({
        profileContext: () => ({ userName, memberSince }),
      }),
    [gateway, userName, memberSince]
  );

  const [phase, setPhase] = React.useState<Phase>({ status: 'loading' });
  const [reloads, setReloads] = React.useState(0);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    setPhase({ status: 'loading' });
    resolved
      .getProfile()
      .then((hub) => {
        if (!cancelled) setPhase({ status: 'ready', hub });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setPhase({
          status: 'error',
          message:
            cause instanceof Error ? cause.message : 'Your profile could not load.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [resolved, isAuthenticated, reloads]);

  const reload = React.useCallback(() => setReloads((n) => n + 1), []);

  const acknowledge = React.useCallback(
    async (index: number) => {
      if (phase.status !== 'ready') return;
      const entry = phase.hub.pendingCelebrations[index];
      // Drop it locally first so the overlay closes immediately; the server ack
      // below is what makes the dismissal durable.
      setPhase({
        status: 'ready',
        hub: {
          ...phase.hub,
          pendingCelebrations: phase.hub.pendingCelebrations.filter(
            (_, at) => at !== index
          ),
        },
      });
      if (!entry?.id) return;
      try {
        await resolved.acknowledgeCelebration(entry.id);
      } catch {
        // An ack that failed is simply offered again on the next load.
      }
    },
    [phase, resolved]
  );

  if (!isAuthenticated) return <MissionsLoggedOutState />;
  if (phase.status === 'loading') return <MissionsLoadingState />;
  if (phase.status === 'error') {
    return <MissionsErrorState message={phase.message} onRetry={reload} />;
  }

  const { hub } = phase;
  const untouched =
    hub.level.lifetimeXp === 0 &&
    hub.streak.current === 0 &&
    hub.streak.best === 0 &&
    hub.activeMissions.length === 0 &&
    hub.history.length === 0;

  if (untouched) {
    return (
      <MissionsUnavailableState message="Accept your first mission on the next card and your XP, level and Card Streak start here." />
    );
  }

  return (
    <>
      <ProfileMissionHub state={{ ...hub, userName, memberSince }} />
      <CelebrationLayer
        queue={hub.pendingCelebrations}
        onAcknowledge={acknowledge}
      />
    </>
  );
}
