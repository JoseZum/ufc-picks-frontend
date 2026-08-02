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
import type { LabBout, MissionOffer, MockSelection } from '../contracts/mission-mock-models';
import { MISSION_PICKERS, isDraftComplete } from '../renderers/pickers';
import { instructionLabelFor } from '../renderers/instruction-copy';
import { DifficultyBadge } from './mission-shared';

interface Props {
  offer: MissionOffer | null;
  slot: 1 | 2 | 3 | null;
  bouts: LabBout[];
  submitting: boolean;
  errorText?: string | null;
  onClose: () => void;
  onConfirm: (slot: 1 | 2 | 3, offer: MissionOffer, selection: MockSelection) => void;
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
  submitting,
  errorText,
  onClose,
  onConfirm,
}: Props) {
  const [draft, setDraft] = React.useState<MockSelection | null>(null);
  const [step, setStep] = React.useState<'pick' | 'confirm'>('pick');

  // Reset whenever a different offer opens the drawer.
  React.useEffect(() => {
    setDraft(null);
    setStep('pick');
  }, [offer?.offerId]);

  if (!offer || !slot) return null;

  const Picker = MISSION_PICKERS[offer.interaction];
  const canContinue = isDraftComplete(offer, draft);
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
                  onClick={() => setStep('confirm')}
                >
                  Continue
                </button>
                <button type="button" className="ml-btn ml-btn--ghost" onClick={onClose}>
                  Cancel
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
                  onClick={() => setStep('pick')}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="ml-btn ml-btn--primary"
                  disabled={submitting || !draft}
                  onClick={() => draft && onConfirm(slot, offer, draft)}
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
