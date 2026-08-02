/**
 * FE-000A — presentation gate for the selection drawer.
 *
 * Answers only "can the user press Continue", never "is this selection legal".
 * Eligibility stays backend authority. Kept JSX-free so the node test runner
 * can import it directly.
 */

import type {
  MissionOffer,
  MockSelection,
  TargetFighterMissionOffer,
  WinMethod,
} from '../contracts/mission-mock-models';

const ALL_METHODS: WinMethod[] = ['KO/TKO', 'Submission', 'Decision'];

/**
 * Methods a TARGET_FIGHTER definition accepts. A mission that needs an exact
 * finishing round can never accept Decision, so that is enforced here as well
 * as in the catalog data — the picker and the gate agree by construction.
 */
export function allowedMethodsFor(offer: TargetFighterMissionOffer): WinMethod[] {
  const declared = offer.allowedMethods ?? ALL_METHODS;
  return offer.requiresRound ? declared.filter((m) => m !== 'Decision') : declared;
}

export function isDraftComplete(offer: MissionOffer, draft: MockSelection | null): boolean {
  if (!draft) return false;
  switch (draft.kind) {
    case 'AUTO':
      return true;
    case 'TARGET_FIGHTER': {
      if (offer.interaction !== 'TARGET_FIGHTER') return false;
      if (offer.requiresMethod) {
        if (!draft.method) return false;
        if (!allowedMethodsFor(offer).includes(draft.method)) return false;
      }
      if (offer.requiresRound && !draft.round) return false;
      return true;
    }
    case 'TARGET_FIGHT':
      return true;
    case 'COMBO_BUILDER': {
      if (offer.interaction !== 'COMBO_BUILDER') return false;
      if (draft.legs.length !== offer.legCount) return false;
      // A leg whose definition offers a choice of method is not finished until
      // one is chosen. Whether the resulting combination is LEGAL (distinct
      // methods, distinct bouts, title bouts) stays backend authority.
      return draft.legs.every((leg, index) => {
        const allowed = offer.legs?.[index]?.allowedMethods;
        if (!allowed?.length) return true;
        return leg.method !== undefined && allowed.includes(leg.method);
      });
    }
    case 'CARD_PROP': {
      if (offer.interaction !== 'CARD_PROP') return false;
      if (offer.propKind === 'accept') return true;
      if (offer.propKind === 'choice') return !!draft.choice;
      return draft.exactCount !== undefined;
    }
  }
}
