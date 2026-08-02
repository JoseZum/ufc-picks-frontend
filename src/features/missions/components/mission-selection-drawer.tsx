'use client';

/**
 * FE-000A — irreversible selection drawer (D-UI-004).
 *
 * Two explicit steps: pick, then confirm. On <=520px CSS the drawer becomes
 * full-screen via missions.css. Built on the existing Radix Dialog primitive so
 * focus trapping, Escape and overlay behavior come from the installed library.
 */

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { Pick as ApiPick } from '@/lib/api';
import type {
  LabBout,
  MissionOffer,
  MockSelection,
  WinMethod,
} from '../contracts/mission-mock-models';
import { MISSION_PICKERS, isDraftComplete } from '../renderers/pickers';
import { instructionLabelFor } from '../renderers/instruction-copy';
import {
  isCompletionSatisfied,
  pickGapsFor,
  toPickPatches,
  type PickCompletion,
  type PickGap,
  type PickPatchInput,
} from '../renderers/pick-completion';
import { DifficultyBadge } from './mission-shared';

interface Props {
  offer: MissionOffer | null;
  slot: 1 | 2 | 3 | null;
  bouts: LabBout[];
  /** The user's picks on this card. Undefined while they are still loading. */
  picks?: ApiPick[];
  submitting: boolean;
  errorText?: string | null;
  onClose: () => void;
  onConfirm: (
    slot: 1 | 2 | 3,
    offer: MissionOffer,
    selection: MockSelection,
    pickPatches: PickPatchInput[]
  ) => void;
}

const METHODS: WinMethod[] = ['KO/TKO', 'Submission', 'Decision'];

function fighterName(bouts: LabBout[], boutId: number, corner: 'red' | 'blue'): string {
  const bout = bouts.find((b) => b.id === boutId);
  if (!bout) return 'Fighter';
  return (corner === 'red' ? bout.red : bout.blue).fighter_name;
}

/**
 * Ask for the fields the mission binds but leaves open.
 *
 * This is a real pick being written on the user's behalf, so it says so. The
 * alternative — inventing a method server-side — would silently put a pick in
 * someone's card that they never made.
 */
function PickCompletionStep({
  gaps,
  bouts,
  completion,
  onChange,
}: {
  gaps: PickGap[];
  bouts: LabBout[];
  completion: PickCompletion;
  onChange: (next: PickCompletion) => void;
}) {
  const set = (boutId: number, patch: { method?: WinMethod; round?: number }) =>
    onChange({ ...completion, [boutId]: { ...completion[boutId], ...patch } });

  return (
    <div className="ml-completion">
      <p className="ml-leg-status">
        <span>This mission also sets your pick. Finish it.</span>
      </p>
      {gaps.map((gap) => {
        const answer = completion[gap.boutId] ?? {};
        const method = gap.knownMethod ?? answer.method;
        const rounds = bouts.find((b) => b.id === gap.boutId)?.roundsScheduled ?? 3;
        return (
          <div className="ml-completion__row" key={gap.boutId}>
            <span className="ml-completion__who">
              {gap.legLabel ? `${gap.legLabel}: ` : ''}
              {fighterName(bouts, gap.boutId, gap.corner)}
            </span>

            {gap.needsMethod ? (
              <div className="ml-method-row" role="group" aria-label="Method">
                {METHODS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`ml-method ${answer.method === option ? 'ml-method--selected' : ''}`}
                    aria-pressed={answer.method === option}
                    onClick={() =>
                      set(gap.boutId, {
                        method: option,
                        // Switching to a decision retires any round already
                        // chosen, instead of sending one the server refuses.
                        round: option === 'Decision' ? undefined : answer.round,
                      })
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <span className="ml-completion__fixed">{method}</span>
            )}

            {method && method !== 'Decision' ? (
              <div className="ml-method-row" role="group" aria-label="Round">
                {Array.from({ length: rounds }, (_, i) => i + 1).map((round) => (
                  <button
                    key={round}
                    type="button"
                    className={`ml-method ${answer.round === round ? 'ml-method--selected' : ''}`}
                    aria-pressed={answer.round === round}
                    onClick={() => set(gap.boutId, { round })}
                  >
                    R{round}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function summarize(offer: MissionOffer, draft: MockSelection | null, bouts: LabBout[]): string {
  const name = (boutId: number, corner: 'red' | 'blue') => {
    const bout = bouts.find((b) => b.id === boutId);
    if (!bout) return 'Fighter';
    const f = corner === 'red' ? bout.red : bout.blue;
    return f.fighter_name;
  };
  if (!draft) return offer.name;
  switch (draft.kind) {
    case 'AUTO':
      return `${offer.name}: tracked automatically`;
    case 'TARGET_FIGHTER': {
      const extras = [draft.method, draft.round ? `Round ${draft.round}` : null]
        .filter(Boolean)
        .join(' · ');
      const who = name(draft.boutId, draft.corner);
      return extras ? `${who} · ${extras}` : who;
    }
    case 'TARGET_FIGHT': {
      const bout = bouts.find((b) => b.id === draft.boutId);
      return bout ? `${bout.red.fighter_name} vs ${bout.blue.fighter_name}` : offer.name;
    }
    case 'COMBO_BUILDER':
      return draft.legs
        .map((l) => {
          // A FIGHT leg has no corner: it names the bout, not a fighter.
          const bout = bouts.find((b) => b.id === l.boutId);
          const who = l.corner
            ? name(l.boutId, l.corner)
            : bout
              ? `${bout.red.fighter_name} vs ${bout.blue.fighter_name}`
              : 'Fight';
          const detail = [l.legLabel, l.method].filter(Boolean).join(' ');
          return detail ? `${detail}: ${who}` : who;
        })
        .join(' · ');
    case 'CARD_PROP':
      if (draft.choice) return `Your side: ${draft.choice}`;
      if (draft.exactCount !== undefined) return `Exactly ${draft.exactCount} on this card`;
      return `${offer.name}: accepted`;
  }
}

export function MissionSelectionDrawer({
  offer,
  slot,
  bouts,
  picks,
  submitting,
  errorText,
  onClose,
  onConfirm,
}: Props) {
  const [draft, setDraft] = React.useState<MockSelection | null>(null);
  const [step, setStep] = React.useState<'pick' | 'complete' | 'confirm'>('pick');
  const [completion, setCompletion] = React.useState<PickCompletion>({});

  // Reset whenever a different offer opens the drawer.
  React.useEffect(() => {
    setDraft(null);
    setCompletion({});
    setStep('pick');
  }, [offer?.offerId]);

  // Which bouts still owe a method or a round. Recomputed from the draft, so
  // changing a leg re-opens exactly the questions that leg reintroduced.
  const gaps = React.useMemo(
    () => (offer ? pickGapsFor(offer, draft, picks) : []),
    [offer, draft, picks]
  );

  if (!offer || !slot) return null;

  const Picker = MISSION_PICKERS[offer.interaction];
  const canContinue = isDraftComplete(offer, draft);
  const completionSatisfied = isCompletionSatisfied(gaps, completion);
  // Skip the completion step entirely when nothing is missing, which is the
  // case for 64 of the 85 missions and for anyone who already picked the card.
  const afterPick = () => setStep(gaps.length ? 'complete' : 'confirm');
  // Several catalog entries phrase the prompt and the description identically;
  // when that happens only the display instruction is shown.
  const sectionLabel = instructionLabelFor(offer.selectionPrompt, offer.description);

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ml-drawer-overlay" />
        <DialogPrimitive.Content
          className="ml-drawer"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Keep focus inside the drawer but never on the confirm button.
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          tabIndex={-1}
        >
          <DialogPrimitive.Close className="ml-drawer__close">CLOSE</DialogPrimitive.Close>

          <span className="ml-drawer__eyebrow">
            MISSION {String(slot).padStart(2, '0')} · {offer.interaction.replace('_', ' ')}
          </span>
          <DialogPrimitive.Title className="ml-drawer__title">{offer.name}</DialogPrimitive.Title>
          <div className="ml-drawer__meta">
            <DifficultyBadge difficulty={offer.difficulty} />
            <span className="ml-monthly__xp">{offer.xp} XP</span>
          </div>
          {step === 'pick' ? (
            <>
              {sectionLabel ? (
                <span className="ml-drawer__section-label">{sectionLabel}</span>
              ) : null}
              {/* What the mission asks for, in the same display line for every
                  family. Combos render their own here because that line also
                  carries the leg counter. */}
              {offer.interaction === 'COMBO_BUILDER' ? null : (
                <p className="ml-leg-status">
                  <span>{offer.description}</span>
                </p>
              )}
              <Picker offer={offer} bouts={bouts} draft={draft} onDraft={setDraft} />
              <div className="ml-confirm__actions" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="ml-btn ml-btn--primary"
                  disabled={!canContinue}
                  onClick={afterPick}
                >
                  Continue
                </button>
                <button type="button" className="ml-btn ml-btn--ghost" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          ) : step === 'complete' ? (
            <>
              <PickCompletionStep
                gaps={gaps}
                bouts={bouts}
                completion={completion}
                onChange={setCompletion}
              />
              <div className="ml-confirm__actions" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="ml-btn ml-btn--ghost"
                  onClick={() => setStep('pick')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="ml-btn ml-btn--primary"
                  disabled={!completionSatisfied}
                  onClick={() => setStep('confirm')}
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <div className="ml-confirm">
              <span className="ml-drawer__eyebrow">YOU ARE ABOUT TO LOCK IN</span>
              <p className="ml-confirm__summary">
                <strong>{offer.name}</strong>
                <br />
                {summarize(offer, draft, bouts)}
                <br />
                Reward if completed: {offer.xp} XP
              </p>
              <p className="ml-confirm__warning">
                This choice is final. No rerolls, no swaps, no edits after confirming.
              </p>
              {errorText ? (
                <p className="ml-confirm__warning" style={{ color: 'var(--error)' }} role="alert">
                  {errorText}
                </p>
              ) : null}
              <div className="ml-confirm__actions">
                <button
                  type="button"
                  className="ml-btn ml-btn--ghost"
                  onClick={() => setStep(gaps.length ? 'complete' : 'pick')}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="ml-btn ml-btn--primary"
                  disabled={submitting || !draft}
                  onClick={() =>
                    draft && onConfirm(slot, offer, draft, toPickPatches(gaps, completion))
                  }
                >
                  {submitting ? 'Confirming…' : 'Confirm mission'}
                </button>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
