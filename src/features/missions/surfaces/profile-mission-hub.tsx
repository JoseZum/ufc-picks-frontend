'use client';

/**
 * FE-000A — Profile Mission Hub (D-UI-002).
 *
 * Replaces the fake achievements grid with XP/level/title, the single Card
 * Streak, active missions and basic history. Level numbers arrive pre-resolved
 * from fixtures; React does not compute the curve.
 */

import React from 'react';
import type { ProfileMissionHubVM } from '../contracts/mission-mock-models';
import { MissionCard, MonthlyCard, ProgressBar } from '../components/mission-shared';
import { MissionHistory } from '../components/mission-history';

export function ProfileMissionHub({ state }: { state: ProfileMissionHubVM }) {
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

      <MissionHistory history={state.history} />
    </section>
  );
}
