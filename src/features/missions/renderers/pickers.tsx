'use client';

/**
 * FE-000A — the five interaction pickers used inside the selection drawer.
 *
 * Each picker maps offer + card context + current draft selection to UI, and
 * reports draft changes upward. Validity is purely presentational here (can
 * the user press CONTINUE); real eligibility remains backend authority.
 */

import React from 'react';
import { FighterImage } from '@/components/FighterImage';
import { getFighterDisplayName } from '@/lib/api';
import type {
  CardPropMissionOffer,
  ComboBuilderMissionOffer,
  LabBout,
  MissionInteractionType,
  MissionOffer,
  MockSelection,
  WinMethod,
} from '../contracts/mission-mock-models';
import { allowedMethodsFor } from './draft-validation';

export interface PickerProps {
  offer: MissionOffer;
  bouts: LabBout[];
  draft: MockSelection | null;
  onDraft: (selection: MockSelection | null) => void;
}

export type MissionPicker = (props: PickerProps) => React.ReactNode;

/** The tale of the tape line: record only — country adds nothing to the pick. */
function tapeLine(fighter: LabBout['red']): string {
  const record = fighter.record_at_fight;
  return record ? `${record.wins}-${record.losses}-${record.draws}` : '';
}

// ---------------------------------------------------------------------------
// AUTO — nothing to pick; the confirmation itself is the decision.
// ---------------------------------------------------------------------------

const AutoPicker: MissionPicker = ({ onDraft }) => {
  React.useEffect(() => {
    onDraft({ kind: 'AUTO' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <p className="ml-drawer__desc">
      Tracked automatically from your picks and the card results. Nothing to
      select. Accepting this mission is the only decision.
    </p>
  );
};

// ---------------------------------------------------------------------------
// TARGET_FIGHTER — one fighter, optional method/round (EXACT SCRIPT).
// ---------------------------------------------------------------------------

const TargetFighterPicker: MissionPicker = ({ offer, bouts, draft, onDraft }) => {
  const current = draft?.kind === 'TARGET_FIGHTER' ? draft : null;
  const isTargetFighter = offer.interaction === 'TARGET_FIGHTER';
  const needsMethod = isTargetFighter && offer.requiresMethod;
  const needsRound = isTargetFighter && offer.requiresRound;
  const methods = isTargetFighter ? allowedMethodsFor(offer) : [];

  // Round options are the definition's allowed rounds intersected with the
  // bout's booked length. Both halves are data the backend supplied: the
  // catalog says which rounds count, the card says how many exist.
  const selectedBout = current ? bouts.find((b) => b.id === current.boutId) : undefined;
  const declaredRounds = isTargetFighter ? offer.allowedRounds : undefined;
  const roundOptions = ([1, 2, 3, 4, 5] as const).filter(
    (r) =>
      r <= (selectedBout?.roundsScheduled ?? 3) &&
      (!declaredRounds?.length || declaredRounds.includes(r))
  );

  const choose = (boutId: number, corner: 'red' | 'blue') => {
    // Switching bouts can invalidate a round chosen for a longer fight.
    const nextBout = bouts.find((b) => b.id === boutId);
    const keepRound =
      current?.round && nextBout && current.round <= nextBout.roundsScheduled
        ? current.round
        : undefined;
    onDraft({ kind: 'TARGET_FIGHTER', boutId, corner, method: current?.method, round: keepRound });
  };

  return (
    <div className="ml-roster">
      {bouts.map((bout) => (
        <React.Fragment key={bout.id}>
          <span className="ml-roster__bout-label">
            {bout.weightClass}
            {bout.isMainEvent ? ' · MAIN EVENT' : bout.isCoMain ? ' · CO-MAIN' : ''}
          </span>
          {(['red', 'blue'] as const).map((corner) => {
            const f = corner === 'red' ? bout.red : bout.blue;
            const selected = current?.boutId === bout.id && current?.corner === corner;
            return (
              <button
                key={corner}
                type="button"
                className={`ml-pick-row ${selected ? 'ml-pick-row--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => choose(bout.id, corner)}
              >
                <FighterImage fighter={f} alt="" className="ml-pick-row__img" />
                <span className="ml-pick-row__name">
                  {getFighterDisplayName(f)}
                  <span className="ml-pick-row__sub">{tapeLine(f)}</span>
                </span>
                <span className="ml-pick-row__check">{selected ? 'PICKED' : 'PICK'}</span>
              </button>
            );
          })}
        </React.Fragment>
      ))}

      {needsMethod && current ? (
        <>
          <span className="ml-drawer__section-label">WIN METHOD</span>
          <div className="ml-method-row" role="group" aria-label="Win method">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                className={`ml-method ${current.method === m ? 'ml-method--selected' : ''}`}
                aria-pressed={current.method === m}
                onClick={() => onDraft({ ...current, method: m })}
              >
                {m}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {needsRound && current?.method ? (
        <>
          <span className="ml-drawer__section-label">EXACT ROUND</span>
          <div className="ml-method-row" role="group" aria-label="Exact round">
            {roundOptions.map((r) => (
              <button
                key={r}
                type="button"
                className={`ml-method ${current.round === r ? 'ml-method--selected' : ''}`}
                aria-pressed={current.round === r}
                onClick={() => onDraft({ ...current, round: r })}
              >
                ROUND {r}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TARGET_FIGHT — one bout.
// ---------------------------------------------------------------------------

const TargetFightPicker: MissionPicker = ({ bouts, draft, onDraft }) => {
  const current = draft?.kind === 'TARGET_FIGHT' ? draft : null;
  return (
    <div className="ml-roster">
      {bouts.map((bout) => {
        const selected = current?.boutId === bout.id;
        return (
          <button
            key={bout.id}
            type="button"
            className={`ml-pick-row ${selected ? 'ml-pick-row--selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onDraft({ kind: 'TARGET_FIGHT', boutId: bout.id })}
          >
            <FighterImage fighter={bout.red} alt="" className="ml-pick-row__img" />
            <FighterImage fighter={bout.blue} alt="" className="ml-pick-row__img" />
            <span className="ml-pick-row__name">
              {getFighterDisplayName(bout.red)} vs {getFighterDisplayName(bout.blue)}
              <span className="ml-pick-row__sub">
                {bout.weightClass}
                {bout.isMainEvent ? ' · MAIN EVENT' : bout.isCoMain ? ' · CO-MAIN' : ''}
              </span>
            </span>
            <span className="ml-pick-row__check">{selected ? 'PICKED' : 'PICK'}</span>
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// COMBO_BUILDER — 2/3 legs with per-leg labels when asymmetric.
// ---------------------------------------------------------------------------

const ComboBuilderPicker: MissionPicker = ({ offer, bouts, draft, onDraft }) => {
  const combo = offer as ComboBuilderMissionOffer;
  const legSpecs = combo.legs ?? [];
  // Every leg of a combo targets the same thing. A FIGHT combo picks whole
  // bouts and must never send a corner or a method.
  const fightCombo = (combo.legTarget ?? legSpecs[0]?.target ?? 'FIGHTER') === 'FIGHT';
  const current =
    draft?.kind === 'COMBO_BUILDER' ? draft : { kind: 'COMBO_BUILDER' as const, legs: [] };

  /**
   * Legs fill the definition's slots in order, so leg N carries definition N's
   * `key` and `label`. The key is what the API addresses the leg by; without it
   * the selection is rejected outright.
   */
  const attach = (legs: typeof current.legs) =>
    legs.map((leg, i) => ({
      ...leg,
      key: legSpecs[i]?.key ?? leg.key,
      legLabel: legSpecs[i]?.label ?? combo.legLabels?.[i],
      // A method only survives on a leg whose definition lets the user choose.
      method: legSpecs[i]?.allowedMethods?.length ? leg.method : undefined,
    }));

  const commit = (legs: typeof current.legs) =>
    onDraft({ kind: 'COMBO_BUILDER', legs: attach(legs) });

  const toggleFight = (boutId: number) => {
    const existing = current.legs.findIndex((l) => l.boutId === boutId);
    if (existing >= 0) {
      const legs = [...current.legs];
      legs.splice(existing, 1);
      return commit(legs);
    }
    if (current.legs.length >= combo.legCount) return; // full — remove one first
    commit([...current.legs, { boutId }]);
  };

  const toggleFighter = (boutId: number, corner: 'red' | 'blue') => {
    const existing = current.legs.findIndex((l) => l.boutId === boutId);
    let legs = [...current.legs];
    if (existing >= 0 && legs[existing].corner === corner) {
      legs.splice(existing, 1); // deselect same fighter
    } else if (existing >= 0) {
      legs[existing] = { ...legs[existing], corner }; // switch corner, keep slot
    } else if (legs.length < combo.legCount) {
      legs = [...legs, { boutId, corner }];
    } else {
      return; // builder full — must remove a leg first
    }
    commit(legs);
  };

  const setLegMethod = (legIndex: number, method: WinMethod) => {
    const legs = current.legs.map((leg, i) =>
      i === legIndex ? { ...leg, method } : leg
    );
    onDraft({ kind: 'COMBO_BUILDER', legs });
  };

  const counter = (
    <p className="ml-leg-status" aria-live="polite">
      <span>{combo.legRule}</span>
      <span
        className={`ml-leg-status__count ${
          current.legs.length >= combo.legCount ? 'ml-leg-status__count--done' : ''
        }`}
      >
        LEG {Math.min(current.legs.length, combo.legCount)} / {combo.legCount}
      </span>
    </p>
  );

  // Legs whose definition offers a choice of method need one control each.
  const methodChoosers = current.legs.map((leg, index) => {
    const allowed = legSpecs[index]?.allowedMethods;
    if (!allowed?.length) return null;
    return (
      <React.Fragment key={`method-${index}`}>
        <span className="ml-drawer__section-label">
          {(leg.legLabel ?? `LEG ${index + 1}`).toUpperCase()} · METHOD
        </span>
        <div className="ml-method-row" role="group" aria-label={`Method for leg ${index + 1}`}>
          {allowed.map((m) => (
            <button
              key={m}
              type="button"
              className={`ml-method ${leg.method === m ? 'ml-method--selected' : ''}`}
              aria-pressed={leg.method === m}
              onClick={() => setLegMethod(index, m)}
            >
              {m}
            </button>
          ))}
        </div>
      </React.Fragment>
    );
  });

  if (fightCombo) {
    return (
      <div className="ml-roster">
        {counter}
        {bouts.map((bout) => {
          const legIndex = current.legs.findIndex((l) => l.boutId === bout.id);
          const selected = legIndex >= 0;
          return (
            <button
              key={bout.id}
              type="button"
              className={`ml-pick-row ${selected ? 'ml-pick-row--selected' : ''}`}
              aria-pressed={selected}
              onClick={() => toggleFight(bout.id)}
            >
              <FighterImage fighter={bout.red} alt="" className="ml-pick-row__img" />
              <FighterImage fighter={bout.blue} alt="" className="ml-pick-row__img" />
              <span className="ml-pick-row__name">
                {getFighterDisplayName(bout.red)} vs {getFighterDisplayName(bout.blue)}
                <span className="ml-pick-row__sub">
                  {bout.weightClass}
                  {bout.isMainEvent ? ' · MAIN EVENT' : bout.isCoMain ? ' · CO-MAIN' : ''}
                </span>
              </span>
              <span className="ml-pick-row__check">
                {selected
                  ? (current.legs[legIndex].legLabel ?? `LEG ${legIndex + 1}`)
                  : 'PICK'}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="ml-roster">
      {counter}
      {bouts.map((bout) => (
        <React.Fragment key={bout.id}>
          <span className="ml-roster__bout-label">{bout.weightClass}</span>
          {(['red', 'blue'] as const).map((corner) => {
            const f = corner === 'red' ? bout.red : bout.blue;
            const legIndex = current.legs.findIndex(
              (l) => l.boutId === bout.id && l.corner === corner
            );
            const selected = legIndex >= 0;
            return (
              <button
                key={corner}
                type="button"
                className={`ml-pick-row ${selected ? 'ml-pick-row--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => toggleFighter(bout.id, corner)}
              >
                <FighterImage fighter={f} alt="" className="ml-pick-row__img" />
                <span className="ml-pick-row__name">
                  {getFighterDisplayName(f)}
                  <span className="ml-pick-row__sub">{tapeLine(f)}</span>
                </span>
                <span className="ml-pick-row__check">
                  {selected
                    ? (current.legs[legIndex].legLabel ?? `LEG ${legIndex + 1}`)
                    : 'PICK'}
                </span>
              </button>
            );
          })}
        </React.Fragment>
      ))}
      {methodChoosers}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CARD_PROP — accept / A-B choice / exact count stepper.
// ---------------------------------------------------------------------------

const CardPropPicker: MissionPicker = ({ offer, draft, onDraft }) => {
  const prop = offer as CardPropMissionOffer;
  const current = draft?.kind === 'CARD_PROP' ? draft : null;

  React.useEffect(() => {
    if (prop.propKind === 'accept') onDraft({ kind: 'CARD_PROP' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (prop.propKind === 'accept') {
    return (
      <p className="ml-drawer__desc">
        {prop.displayedTarget !== undefined
          ? `The displayed target for this card is ${prop.displayedTarget}. `
          : ''}
        Accepting the prop is the only decision. Results settle it automatically.
      </p>
    );
  }

  if (prop.propKind === 'choice' && prop.choices) {
    return (
      <div className="ml-choice-grid" role="group" aria-label="Choose your side">
        {prop.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={`ml-choice ${current?.choice === choice ? 'ml-choice--selected' : ''}`}
            aria-pressed={current?.choice === choice}
            onClick={() => onDraft({ kind: 'CARD_PROP', choice })}
          >
            {choice}
          </button>
        ))}
      </div>
    );
  }

  // exact-count
  const max = bouts.length;
  const value = current?.exactCount ?? 0;
  return (
    <div>
      <div className="ml-stepper">
        <button
          type="button"
          className="ml-stepper__btn"
          aria-label="Decrease count"
          disabled={value <= 0}
          onClick={() => onDraft({ kind: 'CARD_PROP', exactCount: value - 1 })}
        >
          −
        </button>
        {/* The count reads against the ceiling as it moves, in the same
            language as every other meter: 4 / 7 FINISHES. */}
        <span className="ml-stepper__value" aria-live="polite">
          {value}
          <span className="ml-stepper__of">/ {max}</span>
          <span className="ml-stepper__unit">{prop.countUnit ?? 'ON THIS CARD'}</span>
        </span>
        <button
          type="button"
          className="ml-stepper__btn"
          aria-label="Increase count"
          disabled={value >= max}
          onClick={() => onDraft({ kind: 'CARD_PROP', exactCount: value + 1 })}
        >
          +
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Registry — the Strategy map for the five families.
// ---------------------------------------------------------------------------

export const MISSION_PICKERS: Record<MissionInteractionType, MissionPicker> = {
  AUTO: AutoPicker,
  TARGET_FIGHTER: TargetFighterPicker,
  TARGET_FIGHT: TargetFightPicker,
  COMBO_BUILDER: ComboBuilderPicker,
  CARD_PROP: CardPropPicker,
};

export { isDraftComplete, allowedMethodsFor } from './draft-validation';
