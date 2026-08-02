/**
 * FE-000A — deterministic mock gateway.
 *
 * Reads the scenario fixtures, keeps in-memory selection state so a simulated
 * selection survives re-renders within the Lab session, and fabricates the
 * post-selection ActiveMissionVM presentation. All authoritative values are
 * fixture data; nothing here is domain logic.
 */

import type {
  ActiveMissionVM,
  AdminMissionsVM,
  HomeMissionsVM,
  MissionOffer,
  MissionSlotVM,
  MockSelection,
  ProfileMissionHubVM,
  SelectionPartVM,
} from '../contracts/mission-mock-models';
import {
  ADMIN_SCENARIOS,
  HOME_SCENARIOS,
  LAB_BOUTS,
  PROFILE_SCENARIOS,
} from '../fixtures/mission-scenarios';
import type { MissionLabGateway } from './mission-gateway';
import { getFighterDisplayName } from '@/lib/api';

const MOCK_LATENCY_MS = 350;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolve `targetBoutId`/`targetCorner` into the actual fighter so surfaces
 * receive a presentation-ready view model and never read fixtures themselves.
 */
function hydrateTarget(mission: ActiveMissionVM): ActiveMissionVM {
  if (!mission.targetBoutId) return mission;
  const bout = LAB_BOUTS.find((b) => b.id === mission.targetBoutId);
  if (!bout) return { ...mission, targetFighter: null };
  return {
    ...mission,
    targetFighter: mission.targetCorner === 'blue' ? bout.blue : bout.red,
  };
}

/**
 * Build the choice as labelled parts. Surfaces style each role/value pair on
 * its own, so a combo shows every leg the same way instead of the card having
 * to split a sentence.
 */
function describeSelection(selection: MockSelection): SelectionPartVM[] {
  const boutById = (id: number) => LAB_BOUTS.find((b) => b.id === id);
  const fighterName = (boutId: number, corner: 'red' | 'blue') => {
    const bout = boutById(boutId);
    return bout ? getFighterDisplayName(corner === 'red' ? bout.red : bout.blue) : 'Fighter';
  };

  switch (selection.kind) {
    case 'AUTO':
      return [];
    case 'TARGET_FIGHTER': {
      const parts: SelectionPartVM[] = [
        { label: 'Target', value: fighterName(selection.boutId, selection.corner) },
      ];
      if (selection.method) parts.push({ label: 'Method', value: selection.method });
      if (selection.round) parts.push({ label: 'Round', value: `R${selection.round}` });
      return parts;
    }
    case 'TARGET_FIGHT': {
      const bout = boutById(selection.boutId);
      return [
        {
          label: 'Fight',
          value: bout
            ? `${getFighterDisplayName(bout.red)} vs ${getFighterDisplayName(bout.blue)}`
            : 'Selected',
        },
      ];
    }
    case 'COMBO_BUILDER':
      return selection.legs.map((leg) => ({
        label: leg.legLabel,
        value: fighterName(leg.boutId, leg.corner),
      }));
    case 'CARD_PROP':
      if (selection.choice) return [{ label: 'Your lane', value: selection.choice }];
      if (selection.exactCount !== undefined) {
        return [{ label: 'Your call', value: `Exactly ${selection.exactCount}` }];
      }
      return [{ value: 'Prop accepted' }];
  }
}

/** Flat text version, kept for labels and any surface without part styling. */
function summarize(parts: SelectionPartVM[]): string | undefined {
  if (parts.length === 0) return undefined;
  return parts.map((p) => (p.label ? `${p.label}: ${p.value}` : p.value)).join(' · ');
}

/** One gateway instance per scenario id; selection state resets on scenario change. */
export function createMockMissionGateway(scenarioId: string): MissionLabGateway {
  const selectedBySlot = new Map<1 | 2 | 3, ActiveMissionVM>();
  const failMode = scenarioId === 'edge-error';
  const latency = scenarioId === 'edge-loading' ? 60_000 : MOCK_LATENCY_MS;

  const homeBase = (): HomeMissionsVM => {
    const base =
      HOME_SCENARIOS[scenarioId] ??
      // Edge scenarios reuse the open layout underneath their edge treatment.
      HOME_SCENARIOS['home-open'];
    const slots = base.slots.map((slot): MissionSlotVM => {
      const chosen = selectedBySlot.get(slot.slot);
      if (chosen) return { slot: slot.slot, state: 'active', mission: hydrateTarget(chosen) };
      if (slot.state === 'active' || slot.state === 'settled') {
        return { ...slot, mission: hydrateTarget(slot.mission) };
      }
      return slot;
    });
    return { ...base, slots };
  };

  return {
    async getHomeState() {
      await wait(latency);
      if (failMode) throw new Error('Mock gateway error (edge-error scenario)');
      return homeBase();
    },

    async getProfileState() {
      await wait(MOCK_LATENCY_MS);
      const base = PROFILE_SCENARIOS[scenarioId] ?? PROFILE_SCENARIOS['profile-live'];
      return { ...base, activeMissions: base.activeMissions.map(hydrateTarget) };
    },

    async getAdminState() {
      await wait(MOCK_LATENCY_MS);
      return ADMIN_SCENARIOS[scenarioId] ?? ADMIN_SCENARIOS['admin-active'];
    },

    async selectMission(slot, offerId, selection) {
      await wait(MOCK_LATENCY_MS);
      const home = homeBase();
      const slotVM = home.slots.find((s) => s.slot === slot);
      if (!slotVM || slotVM.state !== 'open') {
        throw new Error('Slot is not open for selection');
      }
      const offer = slotVM.offers.find((o) => o.offerId === offerId);
      if (!offer) throw new Error('Unknown offer');

      const target =
        selection.kind === 'TARGET_FIGHTER'
          ? { boutId: selection.boutId, corner: selection.corner }
          : selection.kind === 'TARGET_FIGHT'
            ? { boutId: selection.boutId, corner: 'red' as const }
            : selection.kind === 'COMBO_BUILDER' && selection.legs[0]
              ? { boutId: selection.legs[0].boutId, corner: selection.legs[0].corner }
              : null;

      const parts = describeSelection(selection);
      const mission: ActiveMissionVM = {
        missionId: offer.missionId,
        name: offer.name,
        interaction: offer.interaction,
        difficulty: offer.difficulty,
        xp: offer.xp,
        selectionSummary: summarize(parts),
        selection: parts.length > 0 ? parts : undefined,
        targetBoutId: target?.boutId,
        targetCorner: target?.corner,
        progressText: 'Awaiting first result',
        progressPct: 0,
        status: 'ACTIVE',
      };
      selectedBySlot.set(slot, mission);
      return hydrateTarget(mission);
    },

    async acknowledgeCelebration() {
      await wait(120);
    },
  };
}
