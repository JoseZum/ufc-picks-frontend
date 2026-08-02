'use client';

/**
 * FE-000A — Home mission surface (monthly + three slots).
 *
 * Add-only block designed to sit below the leaderboard on Home, using the same
 * broadcast language as the rest of V2: stamped red section title, real card
 * art, cinematic cards with cut corners and ghost numbers. In FE-000A it is
 * only mounted by /mission-lab; it is not wired into the production page.
 */

import React from 'react';
import type {
  HomeMissionsVM,
  MissionOffer,
  MissionSlotVM,
  MockSelection,
} from '../contracts/mission-mock-models';
import { MissionCard, MonthlyCard } from '../components/mission-shared';
import { MissionSelectionDrawer } from '../components/mission-selection-drawer';
import type { PickPatchInput } from '../renderers/pick-completion';
import type { Pick as ApiPick } from '@/lib/api';

const LOCK_TEXT: Record<string, string> = {
  'picks-closed': 'Picks closed for this card',
  'admin-closed': 'Missions closed by admin',
  'results-started': 'First result registered',
};

interface Props {
  state: HomeMissionsVM;
  /**
   * The user's picks on this card. The drawer needs them to know whether a
   * pick-writing mission still has to ask for a method or a round; without
   * them it would ask for fields the user already supplied.
   */
  picks?: ApiPick[];
  onSelect: (
    slot: 1 | 2 | 3,
    offer: MissionOffer,
    selection: MockSelection,
    pickPatches: PickPatchInput[]
  ) => Promise<{ name: string; xp: number } | void>;
  /**
   * Where "VIEW ALL" goes. In production this is a link to /profile; the
   * Mission Lab passes a handler that switches to a Profile scenario instead.
   */
  onViewAll?: () => void;
}

export function HomeMissions({ state, picks, onSelect, onViewAll }: Props) {
  const [openOffer, setOpenOffer] = React.useState<{ slot: 1 | 2 | 3; offer: MissionOffer } | null>(
    null
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirm = async (
    slot: 1 | 2 | 3,
    offer: MissionOffer,
    selection: MockSelection,
    pickPatches: PickPatchInput[]
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      await onSelect(slot, offer, selection, pickPatches);
      setOpenOffer(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Selection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isClosed = state.lockLabel.includes('COMPLETE') || state.lockLabel.includes('LOCKED');

  return (
    <section className="ml-section" aria-labelledby="ml-missions-title">
      <div className="ml-section__header">
        <h2 className="ml-section__title" id="ml-missions-title">
          MISSIONS
        </h2>
        {onViewAll ? (
          <button type="button" className="ml-section__link" onClick={onViewAll}>
            VIEW ALL →
          </button>
        ) : (
          <a className="ml-section__link" href="/profile">
            VIEW ALL →
          </a>
        )}
      </div>

      <div
        className="ml-event-strip"
        style={
          state.event.eventImageUrl
            ? { backgroundImage: `url(${state.event.eventImageUrl})` }
            : undefined
        }
      >
        <span className="ml-event-strip__name">
          <span className="ml-event-strip__eyebrow">THIS CARD</span>
          {state.event.eventName}
        </span>
        <span className={`ml-event-strip__lock ${isClosed ? 'ml-event-strip__lock--closed' : ''}`}>
          {state.lockLabel}
        </span>
      </div>

      <MonthlyCard monthly={state.monthly} />

      <div className="ml-slots">
        {state.slots.map((slot) => (
          <SlotCard
            key={slot.slot}
            slot={slot}
            onOpenOffer={(offer) => setOpenOffer({ slot: slot.slot, offer })}
          />
        ))}
      </div>

      <MissionSelectionDrawer
        offer={openOffer?.offer ?? null}
        slot={openOffer?.slot ?? null}
        bouts={state.event.bouts}
        picks={picks}
        submitting={submitting}
        errorText={error}
        onClose={() => {
          setOpenOffer(null);
          setError(null);
        }}
        onConfirm={confirm}
      />
    </section>
  );
}

function SlotCard({
  slot,
  onOpenOffer,
}: {
  slot: MissionSlotVM;
  onOpenOffer: (offer: MissionOffer) => void;
}) {
  const num = String(slot.slot).padStart(2, '0');

  if (slot.state === 'no-offers') {
    return (
      <div className="ml-slot ml-slot--empty" data-num={num}>
        <span className="ml-slot__locked-badge">SOON</span>
        <span className="ml-slot__locked-text">Offers are drawn once the card is confirmed</span>
      </div>
    );
  }

  if (slot.state === 'locked') {
    return (
      <div className="ml-slot ml-slot--locked" data-num={num}>
        <span className="ml-slot__locked-badge">LOCKED</span>
        <span className="ml-slot__locked-text">{LOCK_TEXT[slot.reason]}</span>
      </div>
    );
  }

  if (slot.state === 'active' || slot.state === 'settled') {
    const statusClass = slot.mission.status.toLowerCase().replace(/_/g, '-');
    return (
      <div className={`ml-slot ml-slot--${statusClass}`} data-num={num}>
        <span className="ml-slot__label">MISSION {num}</span>
        <MissionCard mission={slot.mission} />
      </div>
    );
  }

  return (
    <div className="ml-slot" data-num={num}>
      <span className="ml-slot__label">MISSION {num}</span>
      <span className="ml-slot__prompt">CHOOSE ONE</span>
      {slot.offers.map((offer) => (
        <button
          key={offer.offerId}
          type="button"
          className={`ml-offer ml-offer--${offer.difficulty.toLowerCase()}`}
          onClick={() => onOpenOffer(offer)}
        >
          <span className="ml-offer__body">
            <span className="ml-offer__tier">{offer.difficulty}</span>
            <span className="ml-offer__name">{offer.name}</span>
          </span>
          <span className="ml-offer__xp">
            {offer.xp}
            <small>XP</small>
          </span>
        </button>
      ))}
    </div>
  );
}
