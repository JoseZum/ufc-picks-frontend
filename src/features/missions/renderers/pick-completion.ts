/**
 * What a mission still needs before it can write a valid canonical pick.
 *
 * A mission with a pick effect rewrites the user's pick on the bouts it binds,
 * and the backend only accepts a COMPLETE pick: a winner, a method, and — for
 * anything that is not a decision — a round. Several catalog entries bind the
 * winner and leave the rest open, so on a bout the user never picked there is
 * nothing to inherit those fields from and the selection is refused with
 * `A complete canonical pick method is required`.
 *
 * Fourteen of the twenty-one pick-coupled missions land there, two of them EASY,
 * which is the tier a brand-new user is offered first. This module decides what
 * to ask for; the drawer only renders it.
 *
 * The rules below mirror `selection.py` deliberately. React is not the
 * authority — a wrong answer here produces a refusal from the server, never a
 * bad write — but asking for a field the server would not have needed is a
 * worse experience than not asking at all.
 */

import type { Pick as ApiPick } from '@/lib/api';
import type { MissionOffer, MockSelection, WinMethod } from '../contracts/mission-mock-models';

/** One bout whose canonical pick cannot be completed from what we already have. */
export interface PickGap {
  boutId: number;
  corner: 'red' | 'blue';
  /** Label the mission gave this leg, so a 3-leg combo names each row. */
  legLabel?: string;
  needsMethod: boolean;
  /** Only ever true once a method is known and it is not a decision. */
  needsRound: boolean;
  /** The method already settled — by the mission or by an existing pick. */
  knownMethod?: WinMethod;
}

/** What the user filled in for a gap, keyed by bout id. */
export type PickCompletion = Record<number, { method?: WinMethod; round?: number }>;

/** The `pick_patches` entry the API expects. */
export interface PickPatchInput {
  boutId: number;
  method?: WinMethod;
  round?: number;
}

const METHOD_FROM_PICK: Record<string, WinMethod> = {
  'KO/TKO': 'KO/TKO',
  SUB: 'Submission',
  DEC: 'Decision',
};

function existingMethod(pick: ApiPick | undefined): WinMethod | undefined {
  if (!pick) return undefined;
  return METHOD_FROM_PICK[pick.picked_method];
}

/** The bouts a mission binds, with whatever the mission itself already fixed. */
function boundBouts(
  offer: MissionOffer,
  draft: MockSelection
): Array<{ boutId: number; corner: 'red' | 'blue'; method?: WinMethod; round?: number; legLabel?: string }> {
  switch (draft.kind) {
    case 'TARGET_FIGHTER':
      return [
        {
          boutId: draft.boutId,
          corner: draft.corner,
          method: draft.method,
          round: draft.round,
        },
      ];
    case 'COMBO_BUILDER': {
      // A leg whose method the catalog fixed carries NO method in the draft —
      // the payload rejects echoing it — so the fixed value has to be read off
      // the offer. Missing that, a KO HAT TRICK would ask the user to choose a
      // method it already decided, and the server would refuse the conflict.
      const specs = new Map(
        (offer.interaction === 'COMBO_BUILDER' ? (offer.legs ?? []) : []).map(
          (leg) => [leg.key, leg] as const
        )
      );
      return draft.legs
        // A FIGHT leg names a bout rather than a fighter, so it writes no pick.
        .filter((leg) => leg.corner !== undefined && leg.corner !== null)
        .map((leg) => {
          const spec = leg.key ? specs.get(leg.key) : undefined;
          return {
            boutId: leg.boutId,
            corner: leg.corner as 'red' | 'blue',
            method: spec?.method ?? leg.method,
            round: spec?.round,
            legLabel: spec?.label ?? leg.legLabel,
          };
        });
    }
    default:
      return [];
  }
}

/**
 * Which bound bouts still need something from the user.
 *
 * Returns an empty list for every mission that writes no picks, for every bout
 * the mission already pinned down, and for every bout the user has already
 * picked completely — which is the common case once someone has filled a card.
 */
export function pickGapsFor(
  offer: MissionOffer,
  draft: MockSelection | null,
  picks: ApiPick[] | undefined
): PickGap[] {
  if (!draft || !offer.pickEffect || offer.pickEffect === 'NONE') return [];

  const byBout = new Map((picks ?? []).map((pick) => [pick.bout_id, pick] as const));
  const gaps: PickGap[] = [];

  for (const bound of boundBouts(offer, draft)) {
    const existing = byBout.get(bound.boutId);
    const method = bound.method ?? existingMethod(existing);

    if (!method) {
      // Nothing settles the method, so the round cannot be judged yet either.
      gaps.push({
        boutId: bound.boutId,
        corner: bound.corner,
        legLabel: bound.legLabel,
        needsMethod: true,
        needsRound: false,
      });
      continue;
    }

    if (method === 'Decision') continue; // a decision pick carries no round

    const round = bound.round ?? existing?.picked_round;
    if (round == null) {
      gaps.push({
        boutId: bound.boutId,
        corner: bound.corner,
        legLabel: bound.legLabel,
        needsMethod: false,
        needsRound: true,
        knownMethod: method,
      });
    }
  }

  return gaps;
}

/** Whether every gap has been answered well enough to submit. */
export function isCompletionSatisfied(
  gaps: PickGap[],
  completion: PickCompletion
): boolean {
  return gaps.every((gap) => {
    const answer = completion[gap.boutId];
    if (!answer) return false;
    const method = gap.knownMethod ?? answer.method;
    if (!method) return false;
    // Choosing a decision retroactively removes the round requirement.
    if (method === 'Decision') return true;
    return answer.round != null;
  });
}

/**
 * Turn the answers into patches, dropping anything the mission already fixed.
 *
 * A patch that repeats a mission-bound value is not merely redundant: the
 * backend rejects a patch that disagrees with the binding, so echoing values
 * back is how a harmless UI ends up producing a refusal.
 */
export function toPickPatches(
  gaps: PickGap[],
  completion: PickCompletion
): PickPatchInput[] {
  return gaps
    .map((gap) => {
      const answer = completion[gap.boutId] ?? {};
      const method = gap.needsMethod ? answer.method : undefined;
      const effective = gap.knownMethod ?? answer.method;
      const round = effective === 'Decision' ? undefined : answer.round;
      if (!method && round == null) return null;
      return { boutId: gap.boutId, ...(method ? { method } : {}), ...(round != null ? { round } : {}) };
    })
    .filter((patch): patch is PickPatchInput => patch !== null);
}
