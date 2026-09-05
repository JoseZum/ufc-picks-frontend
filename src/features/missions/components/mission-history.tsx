'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { HistoryRowVM } from '../contracts/mission-mock-models';
import '../missions.css';

type HistoryFilter = 'ALL' | 'COMPLETED' | 'FAILED' | 'VOID';
const FILTERS: HistoryFilter[] = ['ALL', 'COMPLETED', 'FAILED', 'VOID'];
const TIER_LETTER: Record<HistoryRowVM['difficulty'], string> = {
  EASY: 'E', MEDIUM: 'M', HARD: 'H', MONTHLY: '★',
};

/** The same settled record in the owner's hub, public page and profile dialog. */
export function MissionHistory({ history }: { history: HistoryRowVM[] }) {
  const [filter, setFilter] = React.useState<HistoryFilter>('ALL');
  const titleId = React.useId();
  const rows = history.filter((row) => filter === 'ALL' || row.status === filter);

  return (
    <section className="ml-history-section" aria-labelledby={titleId}>
      <div className="ml-section__header">
        <h3 className="ml-section__title ml-section__title--sub" id={titleId}>
          MISSION HISTORY
        </h3>
        <div className="ml-method-row" role="group" aria-label="History filter">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`ml-filter ${filter === value ? 'ml-filter--active' : ''}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="ml-history__empty">
          {history.length === 0 ? 'No mission history yet.' : 'No missions match this filter.'}
        </p>
      ) : (
        <div className="ml-history">
          {rows.map((row) => (
            <details
              className={`ml-history__entry ml-history__row--${row.status.toLowerCase()}`}
              key={row.assignmentId ?? `${row.missionName}-${row.eventLabel}-${row.difficulty}`}
            >
              <summary className="ml-history__row">
                <span
                  className={`ml-history__tier ml-history__tier--${row.difficulty.toLowerCase()}`}
                  title={row.difficulty}
                  aria-label={row.difficulty}
                >
                  {TIER_LETTER[row.difficulty]}
                </span>
                <span className="ml-history__status">
                  <span className={`ml-status ml-status--${row.status.toLowerCase()}`}>
                    {row.status}
                  </span>
                </span>
                <span className="ml-history__name">
                  <span>{row.missionName}</span>
                  <ChevronDown className="ml-history__chevron" size={16} aria-hidden="true" />
                </span>
                <span className="ml-history__event">{row.eventLabel}</span>
                <span className={`ml-history__xp ${row.xp > 0 ? '' : 'ml-history__xp--none'}`}>
                  {row.xp > 0 ? <>+{row.xp}<small>XP</small></> : '0'}
                </span>
              </summary>
              <div className="ml-history__detail">
                <p>{row.description?.trim() || 'Description unavailable for this mission.'}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
