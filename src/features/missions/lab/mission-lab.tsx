'use client';

/**
 * FE-000A — development-only Mission Lab shell (D-UI-006).
 *
 * Scenario switcher over the deterministic mock gateway. This component is only
 * reachable through the /mission-lab route, which refuses to render outside
 * development unless NEXT_PUBLIC_ENABLE_MISSION_LAB is explicitly set.
 */

import React from 'react';
import { V2Layout } from '@/components/design-system-v2/V2Layout';
import { NavBarV2 } from '@/components/design-system-v2/NavBarV2';
import { MobileNav } from '@/components/design-system-v2/MobileNav';
import '../missions.css';

import type {
  AdminMissionsVM,
  CelebrationVM,
  HomeMissionsVM,
  MissionOffer,
  MockSelection,
  ProfileMissionHubVM,
} from '../contracts/mission-mock-models';
import { LAB_SCENARIOS, LAB_BOUTS } from '../fixtures/mission-scenarios';
import { createMockMissionGateway } from '../gateway/mock-mission-gateway';
import { HomeMissions } from '../surfaces/home-missions';
import { ProfileMissionHub } from '../surfaces/profile-mission-hub';
import { AdminMissionPanel } from '../surfaces/admin-mission-panel';
import { CelebrationLayer, showSelectionToast } from '../components/mission-celebration';
// Same states production Home renders, so a regression here is a regression there.
import {
  MissionsErrorState as ErrorState,
  MissionsLoadingState as LoadingState,
  MissionsLoggedOutState as LoggedOutState,
} from '../components/mission-states';

export function MissionLab() {
  const [scenarioId, setScenarioId] = React.useState<string>('home-open');
  const scenario = LAB_SCENARIOS.find((s) => s.id === scenarioId) ?? LAB_SCENARIOS[0];

  const [home, setHome] = React.useState<HomeMissionsVM | null>(null);
  const [profile, setProfile] = React.useState<ProfileMissionHubVM | null>(null);
  const [admin, setAdmin] = React.useState<AdminMissionsVM | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [celebrations, setCelebrations] = React.useState<CelebrationVM[]>([]);
  const [reloadKey, setReloadKey] = React.useState(0);

  const gateway = React.useMemo(
    () => createMockMissionGateway(scenarioId),
    // A new gateway per scenario/reload resets simulated selections on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenarioId, reloadKey]
  );

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setHome(null);
    setProfile(null);
    setAdmin(null);

    const load = async () => {
      try {
        if (scenario.surface === 'home') {
          const state = await gateway.getHomeState();
          if (!cancelled) setHome(applyEdgeToHome(state, scenario.edge));
        } else if (scenario.surface === 'profile') {
          const state = await gateway.getProfileState();
          if (cancelled) return;
          setProfile(state);
          setCelebrations(state.pendingCelebrations);
        } else {
          const state = await gateway.getAdminState();
          if (!cancelled) setAdmin(state);
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Unknown error');
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [gateway, scenario.surface, scenario.edge]);

  const handleSelect = async (slot: 1 | 2 | 3, offer: MissionOffer, selection: MockSelection) => {
    await gateway.selectMission(slot, offer.offerId, selection);
    const refreshed = await gateway.getHomeState();
    setHome(applyEdgeToHome(refreshed, scenario.edge));
    showSelectionToast(offer.name, offer.xp);
  };

  const acknowledge = async (index: number) => {
    await gateway.acknowledgeCelebration(index);
    setCelebrations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <V2Layout>
      <NavBarV2 />
      <main className="main" style={{ paddingTop: '90px', paddingBottom: '5rem', maxWidth: '1200px' }}>
        <div className="ml-lab-bar">
          <span className="ml-lab-bar__tag">MISSION LAB · DEV ONLY · MOCK DATA</span>
          <label htmlFor="ml-scenario" className="ml-lab-bar__hint">
            SCENARIO
          </label>
          <select
            id="ml-scenario"
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
          >
            {LAB_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="button" className="ml-btn" onClick={() => setReloadKey((k) => k + 1)}>
            Reset scenario
          </button>
          <span className="ml-lab-bar__hint">
            No mission API is called. Nothing here is Contract V1.
          </span>
        </div>

        {scenario.edge === 'stale' ? (
          <div className="ml-stale-banner" role="status">
            <span>DATA MAY BE OUT OF DATE · LAST REFRESHED 14 MINUTES AGO</span>
            <button type="button" className="ml-btn" onClick={() => setReloadKey((k) => k + 1)}>
              Refresh
            </button>
          </div>
        ) : null}

        {scenario.edge === 'logged-out' ? (
          <LoggedOutState />
        ) : loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <>
            {home ? (
              <HomeMissions
                state={home}
                onSelect={handleSelect}
                onViewAll={() => setScenarioId('profile-live')}
              />
            ) : null}
            {profile ? <ProfileMissionHub state={profile} /> : null}
            {admin ? <AdminMissionPanel state={admin} /> : null}
          </>
        )}
      </main>

      <CelebrationLayer queue={celebrations} onAcknowledge={acknowledge} />
      <MobileNav />
    </V2Layout>
  );
}

/**
 * Edge treatments that change the data rather than the shell. The
 * missing-imagery scenario strips fighter photos so the existing placeholder
 * pipeline is exercised end to end.
 */
function applyEdgeToHome(state: HomeMissionsVM, edge?: string): HomeMissionsVM {
  if (edge !== 'missing-imagery') return state;
  return {
    ...state,
    event: {
      ...state.event,
      eventImageUrl: null,
      bouts: LAB_BOUTS.map((bout) => ({
        ...bout,
        red: { ...bout.red, profile_image_url: undefined },
        blue: { ...bout.blue, profile_image_url: undefined },
      })),
    },
  };
}

