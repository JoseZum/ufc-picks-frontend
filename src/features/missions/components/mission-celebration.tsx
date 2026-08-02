'use client';

/**
 * FE-000A — celebrations (D-UI-005).
 *
 * Mission completion = compact sonner toast. Level-up, title change and Card
 * Streak milestones = short full-screen takeover with explicit acknowledgement.
 * Reduced motion is handled in missions.css (animation removed, layout kept).
 */

import React from 'react';
import { toast } from 'sonner';
import type { CelebrationVM } from '../contracts/mission-mock-models';

/** A mission actually settled as completed and XP was credited. */
export function showMissionToast(name: string, xp: number) {
  toast.success(`MISSION COMPLETE: ${name}`, {
    description: `+${xp} XP added to your lifetime total.`,
  });
}

/** A mission was just locked into a slot. No XP yet — it is only pending. */
export function showSelectionToast(name: string, xp: number) {
  toast.success(`MISSION LOCKED IN: ${name}`, {
    description: `Worth ${xp} XP if you complete it. This choice is final.`,
  });
}

interface Props {
  queue: CelebrationVM[];
  onAcknowledge: (index: number) => void;
}

/**
 * Renders the first non-toast celebration in the queue. Toast-kind entries are
 * flushed to sonner and acknowledged immediately, which is how a mixed queue
 * behaves: toasts stack, takeovers appear one at a time.
 */
export function CelebrationLayer({ queue, onAcknowledge }: Props) {
  const firstToastIndex = queue.findIndex((c) => c.kind === 'mission-completed');

  React.useEffect(() => {
    if (firstToastIndex < 0) return;
    const entry = queue[firstToastIndex];
    if (entry.kind === 'mission-completed') {
      showMissionToast(entry.name, entry.xp);
      onAcknowledge(firstToastIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstToastIndex, queue]);

  const takeoverIndex = queue.findIndex((c) => c.kind !== 'mission-completed');
  if (takeoverIndex < 0) return null;
  const celebration = queue[takeoverIndex];
  const remaining = queue.filter((c) => c.kind !== 'mission-completed').length - 1;

  return (
    <div className="ml-celebration" role="dialog" aria-modal="true" aria-label="Celebration">
      {celebration.kind === 'level-up' ? (
        <>
          <span className="ml-celebration__eyebrow">
            {celebration.titleChanged ? 'NEW TITLE UNLOCKED' : 'LEVEL UP'}
          </span>
          <span className="ml-celebration__headline ml-celebration__headline--gold">
            {celebration.title}
          </span>
          <span className="ml-celebration__sub">You reached level {celebration.level}.</span>
        </>
      ) : celebration.kind === 'streak-milestone' ? (
        <>
          <span className="ml-celebration__eyebrow">CARD STREAK MILESTONE</span>
          <span className="ml-celebration__headline">🔥 {celebration.count}</span>
          <span className="ml-celebration__sub">
            {celebration.count} cards in a row. +{celebration.bonusXp} XP bonus.
          </span>
        </>
      ) : null}

      <button
        type="button"
        className="ml-btn ml-btn--primary"
        autoFocus
        onClick={() => onAcknowledge(takeoverIndex)}
      >
        Continue
      </button>
      {remaining > 0 ? (
        <span className="ml-celebration__queue">{remaining} more to review</span>
      ) : null}
    </div>
  );
}
