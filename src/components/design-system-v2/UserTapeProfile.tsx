'use client';

/**
 * The public profile — one component, two frames.
 *
 * This IS the profile: the dialog and the `/users/[userId]` page render the
 * same thing, so there is nothing to click through to and no second, older
 * screen to land on. The dialog scrolls; the page just has more room.
 *
 * Layout is option 02 "tale of the tape": name on one side, level on the
 * other, the record as a tape between them, then missions and every pick.
 */

import React from 'react';
import {
  useUserProfile,
  useUserPicks,
  useUserPicksStats,
  useUserMissionProfile,
  useEvents,
} from '@/lib/hooks';
import { getEventPosterUrl } from '@/lib/api';
import { EventPicksSection } from './EventPicksSection';
import './user-tape-card.css';

export interface UserTapeProfileProps {
  userId: string;
  /** The dialog renders its own title; the page renders a plain heading. */
  renderName?: (name: string) => React.ReactNode;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="utc-tape__cell">
      <b>{value}</b>
      <i>{label}</i>
    </div>
  );
}

export function useUserTapeData(userId: string) {
  const { data: profile, isPending } = useUserProfile(userId);
  const { data: stats } = useUserPicksStats(userId);
  // Missions are gated: a 404 means the feature is dark for this viewer, which
  // is a normal state and must not blank the rest of the profile.
  const { data: missions } = useUserMissionProfile(userId || null);
  const { data: picks } = useUserPicks(userId, { limit: 200 });
  const { data: eventsData } = useEvents({ limit: 50 });

  const events = React.useMemo(() => eventsData?.events ?? [], [eventsData]);

  const picksByEvent = React.useMemo(() => {
    const grouped = new Map<number, Array<{ pick: any; event: any }>>();
    (picks ?? []).forEach((pick: any) => {
      // A pick can outlive the recent-events window, so fall back to the name
      // and date carried on the pick rather than dropping the card entirely.
      const event =
        events.find((candidate) => candidate.id === pick.event_id) ?? {
          id: pick.event_id,
          name: pick.event_name || 'UNKNOWN EVENT',
          date: pick.event_date,
          status: 'completed',
        };
      grouped.set(pick.event_id, [
        ...(grouped.get(pick.event_id) ?? []),
        { pick, event },
      ]);
    });
    return grouped;
  }, [picks, events]);

  const eventsWithPicks = React.useMemo(
    () =>
      Array.from(picksByEvent.values())
        .map((rows) => rows[0].event)
        .sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        ),
    [picksByEvent]
  );

  return { profile, stats, missions, isPending, picksByEvent, eventsWithPicks };
}

export function UserTapeProfile({ userId, renderName }: UserTapeProfileProps) {
  const { profile, stats, missions, picksByEvent, eventsWithPicks } =
    useUserTapeData(userId);
  const [openEventId, setOpenEventId] = React.useState<number | null>(null);

  const name = (profile?.name ?? '').toUpperCase() || 'FIGHTER';

  // Derived from the two counts. The profile endpoint sends `accuracy` as a
  // 0..1 fraction, so rendering it directly showed a flawless record as "1%".
  const total = stats?.total_picks ?? profile?.picks_total ?? 0;
  const correct = stats?.correct_picks ?? profile?.picks_correct ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const openEvent =
    openEventId != null
      ? eventsWithPicks.find((event) => event.id === openEventId)
      : null;

  return (
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
            {renderName ? renderName(name) : <h1 className="utc-name">{name}</h1>}
            <span className="utc-sub">
              {profile?.total_points ?? 0} POINTS
              {profile?.created_at
                ? ` · MEMBER SINCE ${new Date(profile.created_at)
                    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    .toUpperCase()}`
                : ''}
            </span>
          </div>
        </div>

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
            <span className="utc-sub">{missions.lifetime_xp} LIFETIME XP</span>
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

      <h4 className="utc-h">
        {openEvent ? openEvent.name.toUpperCase() : 'PICKS BY EVENT'}
        {openEvent ? (
          <button
            type="button"
            className="utc-back"
            onClick={() => setOpenEventId(null)}
          >
            ← ALL EVENTS
          </button>
        ) : (
          <span className="utc-count">{eventsWithPicks.length} EVENTS</span>
        )}
      </h4>

      {eventsWithPicks.length === 0 ? (
        <p className="utc-sub">NO PICKS YET.</p>
      ) : openEvent ? (
        <EventPicksSection
          event={openEvent}
          picks={picksByEvent.get(openEvent.id) ?? []}
          pickColumnLabel={`${name}'S PICK`}
        />
      ) : (
        <div className="utc-events">
          {eventsWithPicks.map((event) => {
            const poster = getEventPosterUrl(event as any);
            const rows = picksByEvent.get(event.id) ?? [];
            const decided = rows.filter((r) => r.pick.is_correct !== null);
            const hits = decided.filter((r) => r.pick.is_correct === true).length;
            return (
              <button
                type="button"
                className="utc-event"
                key={event.id}
                onClick={() => setOpenEventId(event.id)}
              >
                <span
                  className="utc-event__art"
                  style={
                    poster && !poster.endsWith('placeholder-event.svg')
                      ? { backgroundImage: `url(${poster})` }
                      : undefined
                  }
                />
                <span className="utc-event__meta">
                  <span className="utc-event__name">{event.name.toUpperCase()}</span>
                  <span className="utc-event__score">
                    {decided.length ? `${hits}/${decided.length}` : `${rows.length}`}
                    <i>{decided.length ? 'CORRECT' : 'PICKS'}</i>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
