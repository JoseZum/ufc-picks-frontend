/**
 * Mock adapter for `MissionGateway`.
 *
 * A thin translation over the existing deterministic Lab gateway — it does not
 * reimplement any fixture behaviour. Its job is to speak the production
 * boundary's vocabulary (event-scoped requests, offers instead of offer ids,
 * celebration ids instead of array positions) so the same contract suite can be
 * pointed at it and at the HTTP adapter.
 */

import type {
  CelebrationVM,
  ProfileMissionHubVM,
} from '../contracts/mission-mock-models';
import type {
  MissionGateway,
  MissionHomeRequest,
  MissionSelectRequest,
} from './mission-gateway';
import { createMockMissionGateway } from './mock-mission-gateway';

export interface MockMissionGatewayOptions {
  /** Any id from `LAB_SCENARIOS`, e.g. `home-open`, `home-locked`. */
  scenarioId?: string;
}

/** Stable identity for a fixture celebration that has none of its own. */
function celebrationId(celebration: CelebrationVM, index: number): string {
  return celebration.id ?? `${celebration.kind}#${index}`;
}

export function createMockGateway(
  options: MockMissionGatewayOptions = {}
): MissionGateway {
  const scenarioId = options.scenarioId ?? 'home-open';
  const lab = createMockMissionGateway(scenarioId);
  const acknowledged = new Set<string>();

  return {
    async getHome(request: MissionHomeRequest) {
      const vm = await lab.getHomeState();
      // The card always comes from the caller, exactly as over HTTP: the
      // mission payload owns the missions, the event endpoints own the card.
      return { ...vm, event: request.card };
    },

    async getProfile(): Promise<ProfileMissionHubVM> {
      const vm = await lab.getProfileState();
      const withIds = vm.pendingCelebrations.map((celebration, index) => ({
        ...celebration,
        id: celebrationId(celebration, index),
      }));
      return {
        ...vm,
        pendingCelebrations: withIds.filter((c) => !acknowledged.has(c.id)),
      };
    },

    async select(request: MissionSelectRequest) {
      return lab.selectMission(request.slot, request.offer.offerId, request.selection);
    },

    async acknowledgeCelebration(celebrationId: string) {
      await lab.acknowledgeCelebration(0);
      // Idempotent by construction: acking twice is a no-op.
      acknowledged.add(celebrationId);
    },
  };
}
