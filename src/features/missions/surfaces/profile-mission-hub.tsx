'use client';

/**
 * FE-000A — Profile Mission Hub (D-UI-002).
 *
 * Replaces the fake achievements grid with XP/level/title, the single Card
 * Streak, active missions and basic history. Level numbers arrive pre-resolved
 * from fixtures; React does not compute the curve.
 */

import React from 'react';
import type { HistoryRowVM, ProfileMissionHubVM } from '../contracts/mission-mock-models';
import { MissionCard, MonthlyCard, ProgressBar } from '../components/mission-shared';

type HistoryFilter = 'ALL' | 'COMPLETED' | 'FAILED' | 'VOID';

export function ProfileMissionHub({ state }: { state: ProfileMissionHubVM }) {
  const [filter, setFilter] = React.useState<HistoryFilter>('ALL');
  const rows = state.history.filter((r) => filter === 'ALL' || r.status === filter);

  return (
    <section className="ml-section" id="profile-hub" aria-labelledby="ml-hub-title">
      <div className="ml-section__header">
        <h2 className="ml-section__title" id="ml-hub-title">
          MISSION HUB
        </h2>
      </div>

      <div className="ml-hub-hero">
        {/* The level number is the badge; the title beside the name says what
            that number means, so neither figure is stated twice. */}
        <div className="ml-hub-hero__id">
          <span className="ml-hub-hero__level" aria-label={`Level ${state.level.level}`}>
            {state.level.level}
            <span className="ml-hub-hero__level-cap">Level</span>
          </span>
          <span className="ml-hub-hero__who">
            <span className="ml-hub-hero__name">{state.userName}</span>
            <span className="ml-hub-hero__rank">{state.level.title}</span>
          </span>
        </div>

        <div className="ml-hub-hero__stats">
          <span className="ml-hubstat">
            <b className={state.streak.current === 0 ? 'ml-hubstat--dead' : ''}>
              <span className="ml-hubstat__flame" aria-hidden="true">
                🔥
              </span>
              {state.streak.current}
            </b>
            <span>Card streak</span>
          </span>
          <span className="ml-hubstat">
            <b className="ml-hubstat--gold">{state.level.lifetimeXp}</b>
            <span>Lifetime XP</span>
          </span>
        </div>

        {state.streak.justBroken ? (
          <span className="ml-streak__broken">
            Streak broken. You covered 50% or less of the last card
          </span>
        ) : null}

        <ProgressBar
          pct={state.level.levelProgressPct}
          progress={
            state.level.isMaxTitle
              ? undefined
              : {
                  current: state.level.xpIntoLevel,
                  total: state.level.xpForNextLevel,
                  unit: `XP TO LEVEL ${state.level.level + 1}`,
                }
          }
          text={state.level.isMaxTitle ? 'MAX TITLE · NOTHING LEFT TO CLIMB' : undefined}
          tone="accent"
          ariaLabel="Level progress"
        />
      </div>

      <MonthlyCard monthly={state.monthly} />

      <div className="ml-section__header" style={{ marginTop: '1.5rem' }}>
        <h3 className="ml-section__title ml-section__title--sub">ACTIVE MISSIONS</h3>
      </div>
      {state.activeMissions.length === 0 ? (
        <p className="ml-history__empty">
          No active missions. Pick your slots on the next card from Home.
        </p>
      ) : (
        <div className="ml-slots">
          {state.activeMissions.map((m) => (
            <div className="ml-slot" key={m.missionId} data-num="">
              <MissionCard mission={m} />
            </div>
          ))}
        </div>
      )}

      <div className="ml-section__header" style={{ marginTop: '1.5rem' }}>
        <h3 className="ml-section__title ml-section__title--sub">MISSION HISTORY</h3>
        <div className="ml-method-row" role="group" aria-label="History filter">
          {(['ALL', 'COMPLETED', 'FAILED', 'VOID'] as HistoryFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`ml-filter ${filter === f ? 'ml-filter--active' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="ml-history__empty">
          {state.history.length === 0
            ? 'No missions yet. Your first completed mission will appear here.'
            : 'No missions match this filter.'}
        </p>
      ) : (
        <div className="ml-history">
          {rows.map((row, i) => (
            <HistoryRow key={`${row.missionName}-${i}`} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One letter per tier. Monthly missions are not part of the EASY/MEDIUM/HARD
 * scale — they are a fixed-reward family — so they get a mark of their own
 * instead of reusing M, which already means MEDIUM.
 */
const TIER_LETTER: Record<HistoryRowVM['difficulty'], string> = {
  EASY: 'E',
  MEDIUM: 'M',
  HARD: 'H',
  MONTHLY: '★',
};

function HistoryRow({ row }: { row: HistoryRowVM }) {
  const status = row.status.toLowerCase();
  const tier = row.difficulty.toLowerCase();
  return (
    <div className={`ml-history__row ml-history__row--${status}`}>
      <span
        className={`ml-history__tier ml-history__tier--${tier}`}
        title={row.difficulty}
        aria-label={row.difficulty}
      >
        {TIER_LETTER[row.difficulty]}
      </span>
      <span className="ml-history__status">
        <span className={`ml-status ml-status--${status}`}>{row.status}</span>
      </span>
      <span className="ml-history__name">{row.missionName}</span>
      <span className="ml-history__event">{row.eventLabel}</span>
      {row.xp > 0 ? (
        <span className="ml-history__xp">
          +{row.xp}
          <small>XP</small>
        </span>
      ) : (
        <span className="ml-history__xp ml-history__xp--none">0</span>
      )}
    </div>
  );
}
