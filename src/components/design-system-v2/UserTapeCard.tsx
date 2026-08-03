'use client';

/**
 * The "tale of the tape" card for another user, as a dialog.
 *
 * Chosen over a page because this is a glance, not a destination: you are on a
 * leaderboard or a card and you want to know who someone is without losing
 * your place. The full page at `/users/[userId]` still exists and the dialog
 * links to it.
 *
 * Built on the same Radix Dialog the mission drawer uses, so focus trapping,
 * Escape and the overlay behave identically to the rest of the product.
 */

import React from 'react';
import Link from 'next/link';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import {
  useUserProfile,
  useUserPicksStats,
  useUserMissionProfile,
} from '@/lib/hooks';
import './user-tape-card.css';

interface Props {
  userId: string | null;
  onClose: () => void;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="utc-tape__cell">
      <b>{value}</b>
      <i>{label}</i>
    </div>
  );
}

export function UserTapeCard({ userId, onClose }: Props) {
  const enabled = Boolean(userId);
  const { data: profile, isPending: profilePending } = useUserProfile(userId ?? '');
  const { data: stats } = useUserPicksStats(userId ?? '');
  // Missions are a separate, gated surface: a 404 here means the feature is
  // dark for this viewer, which is a normal state, not a broken card.
  const { data: missions } = useUserMissionProfile(enabled ? userId : null);

  if (!userId) return null;

  const name = (profile?.name ?? '').toUpperCase() || 'FIGHTER';

  // Derived from the two counts rather than read off `accuracy`, which the
  // profile endpoint sends as a 0..1 fraction — rendering it directly showed
  // a flawless record as "1%".
  const total = stats?.total_picks ?? profile?.picks_total ?? 0;
  const correct = stats?.correct_picks ?? profile?.picks_correct ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="utc-overlay" />
        <DialogPrimitive.Content className="utc-card" aria-describedby={undefined}>
          <DialogPrimitive.Close className="utc-close">CLOSE</DialogPrimitive.Close>

          {profilePending ? (
            <div className="utc-loading">
              <Loader2 className="utc-spin" size={22} />
            </div>
          ) : (
            <>
              <div className="utc-hero">
                <div className="utc-hero__left">
                  <div className="utc-avatar">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" />
                    ) : (
                      name.charAt(0)
                    )}
                  </div>
                  <div>
                    <DialogPrimitive.Title className="utc-name">
                      {name}
                    </DialogPrimitive.Title>
                    <span className="utc-sub">
                      {profile?.total_points ?? 0} POINTS
                      {profile?.created_at
                        ? ` · MEMBER SINCE ${new Date(profile.created_at)
                            .toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                            .toUpperCase()}`
                        : ''}
                    </span>
                  </div>
                </div>

                {/* The level side of the tape. Absent while missions are dark
                    for this viewer — the card still reads as a profile. */}
                {missions ? (
                  <div className="utc-hero__right">
                    <span className="utc-level">{missions.level}</span>
                    <span className="utc-title">{missions.title}</span>
                    <div className="utc-meter">
                      <span
                        className="utc-meter__fill"
                        style={{ width: `${missions.level_progress_pct}%` }}
                      />
                    </div>
                    <span className="utc-sub">
                      {missions.lifetime_xp} LIFETIME XP
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="utc-tape">
                <Stat label="ACCURACY" value={`${accuracy}%`} />
                <Stat label="PICKS" value={total} />
                <Stat label="CORRECT" value={correct} />
                <Stat label="PERFECT" value={profile?.perfect_picks ?? 0} />
                {missions ? (
                  <>
                    <Stat label="MISSIONS" value={missions.missions_completed} />
                    <Stat label="BEST STREAK" value={`🔥${missions.best_streak}`} />
                  </>
                ) : null}
              </div>

              {missions && missions.recent.length > 0 ? (
                <>
                  <h4 className="utc-h">MISSIONS COMPLETED</h4>
                  <div className="utc-chips">
                    {missions.recent.map((mission) => (
                      <span
                        className={`utc-chip utc-chip--${mission.difficulty.toLowerCase()}`}
                        key={mission.assignment_id}
                      >
                        {mission.name}
                        <b>+{mission.xp_earned}</b>
                      </span>
                    ))}
                  </div>
                </>
              ) : null}

              <Link href={`/users/${userId}`} className="utc-full" onClick={onClose}>
                VIEW FULL PROFILE →
              </Link>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
