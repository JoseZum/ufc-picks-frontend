'use client';

/**
 * FE-000A — shared mission presentation primitives (badges, progress bar,
 * active/settled mission card). Pure presentation over the mock view models.
 */

import React from 'react';
import { FighterImage } from '@/components/FighterImage';
import type {
  ActiveMissionVM,
  MissionCompareVM,
  MissionDifficulty,
  MissionProgressVM,
  MonthlyVM,
  SelectionPartVM,
} from '../contracts/mission-mock-models';

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: MissionDifficulty | 'MONTHLY';
}) {
  return (
    <span className={`ml-badge ml-badge--${difficulty.toLowerCase()}`}>{difficulty}</span>
  );
}

const STATUS_LABEL: Record<ActiveMissionVM['status'], string> = {
  ACTIVE: 'ACTIVE',
  ONE_TO_GO: '1 TO GO',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  VOID: 'VOID · NO XP',
};

const STATUS_CLASS: Record<ActiveMissionVM['status'], string> = {
  ACTIVE: 'active',
  ONE_TO_GO: 'one-to-go',
  COMPLETED: 'completed',
  FAILED: 'failed',
  VOID: 'void',
};

export function StatusBadge({ status }: { status: ActiveMissionVM['status'] }) {
  return <span className={`ml-status ml-status--${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

/**
 * The count is the headline and the rail supports it. When the mission counts
 * something, the achieved number takes the status colour and the target stays
 * white; when progress is a sentence rather than a fraction ("Awaiting result
 * / win"), the sentence takes the headline slot instead.
 */
export function ProgressBar({
  pct,
  progress,
  compare,
  text,
  tone = 'accent',
  ariaLabel,
}: {
  pct: number;
  progress?: MissionProgressVM;
  compare?: MissionCompareVM[];
  text?: string;
  tone?: 'accent' | 'success' | 'warning';
  ariaLabel: string;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`ml-progress ml-progress--${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={progress ? progress.total : 100}
      aria-valuenow={progress ? progress.current : Math.round(clamped)}
      aria-label={ariaLabel}
    >
      {progress ? (
        <span className="ml-progress__line">
          <span className="ml-progress__num">{progress.current}</span>
          <span className="ml-progress__sep">/</span>
          <span className="ml-progress__total">{progress.total}</span>
          <span className="ml-progress__unit">{progress.unit}</span>
        </span>
      ) : compare && compare.length > 0 ? (
        <span className="ml-progress__line">
          {compare.map((part, i) => (
            <React.Fragment key={part.label}>
              {i > 0 ? <span className="ml-progress__cmp-sep">·</span> : null}
              <span className="ml-progress__cmp-label">{part.label}</span>
              <span className="ml-progress__cmp-value">{part.value}</span>
            </React.Fragment>
          ))}
        </span>
      ) : text ? (
        <span className="ml-progress__line">
          <span className="ml-progress__statement">{text}</span>
        </span>
      ) : null}

      <span className="ml-progress__rail">
        <span className="ml-progress__fill" style={{ width: `${clamped}%` }} />
      </span>
    </div>
  );
}

/**
 * The user's choice: every role muted, every value in the status colour —
 * including each leg of a combo, which is why the parts arrive as data.
 */
function SelectionLine({ mission }: { mission: ActiveMissionVM }) {
  const parts: SelectionPartVM[] =
    mission.selection ?? (mission.selectionSummary ? [{ value: mission.selectionSummary }] : []);
  if (parts.length === 0) return null;

  return (
    <span className="ml-mission__selection">
      {parts.map((part, i) => (
        <React.Fragment key={`${part.label ?? ''}-${part.value}`}>
          {i > 0 ? <span className="ml-mission__pick-sep"> · </span> : null}
          {part.label ? <span className="ml-mission__pick-label">{part.label}</span> : null}
          <span className="ml-mission__pick">{part.value}</span>
          {/* The qualifier rides at the value's side, deliberately quieter:
              the fighter is the choice, the method only describes it. */}
          {part.detail ? <span className="ml-mission__pick-detail">{part.detail}</span> : null}
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * The catalog line, revealed on demand.
 *
 * A mission is chosen once and then lives on the card for the rest of the
 * night, and by then "THREE STRIKES" no longer tells anyone what they signed
 * up for. It stays collapsed so the card keeps its shape, and it is a real
 * `<button>` with `aria-expanded` so it works from the keyboard. The same
 * component is used by Home, your own history and someone else's profile —
 * whoever is reading needs the rules just as much.
 */
function MissionBrief({ text }: { text?: string }) {
  const [open, setOpen] = React.useState(false);
  if (!text) return null;
  return (
    <>
      <button
        type="button"
        className="ml-mission__brief-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'HIDE BRIEF' : "DESCRIPTION"}
      </button>
      {open ? <p className="ml-mission__brief">{text}</p> : null}
    </>
  );
}

export function MissionCard({ mission }: { mission: ActiveMissionVM }) {
  // The gateway already resolved the face; the card never looks it up.
  const targetFighter = mission.targetFighter;
  const tone =
    mission.status === 'COMPLETED'
      ? 'success'
      : mission.status === 'ONE_TO_GO'
        ? 'warning'
        : 'accent';
  return (
    <div className={`ml-mission ml-mission--${STATUS_CLASS[mission.status]}`}>
      {/* Portrait column beside the copy: the face gets real size without
          taking the card over, and a mission with no target still lines up. */}
      <div className="ml-mission__split">
        {targetFighter ? (
          <FighterImage fighter={targetFighter} alt="" className="ml-mission__target-img" />
        ) : null}
        <div className="ml-mission__col">
          <span className="ml-mission__name">{mission.name}</span>
          <StatusBadge status={mission.status} />
          <SelectionLine mission={mission} />
          <MissionBrief text={mission.description} />
        </div>
      </div>

      <span className="ml-mission__spacer" />

      {mission.status === 'VOID' ? (
        <span className="ml-mission__void-reason">{mission.voidReason}</span>
      ) : (
        <ProgressBar
          pct={mission.progressPct}
          progress={mission.progress}
          compare={mission.progressCompare}
          text={mission.progressText}
          tone={tone}
          ariaLabel={`${mission.name} progress`}
        />
      )}
      {mission.status === 'COMPLETED' && mission.earnedXp !== undefined ? (
        <span className="ml-mission__earned">+{mission.earnedXp} XP</span>
      ) : null}
    </div>
  );
}

function MonthlyTag({ month }: { month: string }) {
  return (
    <span>
      <span className="ml-monthly__tag">MONTHLY MISSION</span>
      <span className="ml-monthly__month">{month}</span>
    </span>
  );
}

export function MonthlyCard({ monthly }: { monthly: MonthlyVM }) {
  if (monthly.state === 'not-configured') {
    return (
      <div className="ml-monthly">
        <div className="ml-monthly__main">
          <MonthlyTag month={monthly.monthLabel} />
          <p className="ml-monthly__empty">NOT CONFIGURED YET</p>
        </div>
      </div>
    );
  }

  if (monthly.state === 'month-closed') {
    return (
      <div className="ml-monthly">
        <div className="ml-monthly__main">
          <MonthlyTag month={monthly.monthLabel} />
          <span className="ml-monthly__name">{monthly.name}</span>
          <p className="ml-monthly__desc">{monthly.finalText}</p>
        </div>
        <div className="ml-monthly__reward">
          <span className="ml-monthly__reward-value" style={{ color: 'var(--text-muted)' }}>
            NONE
          </span>
          <span className="ml-monthly__reward-label">MONTH CLOSED</span>
        </div>
      </div>
    );
  }

  const tone =
    monthly.state === 'completed'
      ? 'success'
      : monthly.state === 'near-completion'
        ? 'warning'
        : 'accent';

  return (
    <div className={`ml-monthly ${monthly.state === 'completed' ? 'ml-monthly--completed' : ''}`}>
      <div className="ml-monthly__main">
        <MonthlyTag month={monthly.monthLabel} />
        <span className="ml-monthly__name">{monthly.name}</span>
        <p className="ml-monthly__desc">{monthly.description}</p>

        <ProgressBar
          pct={monthly.progressPct}
          progress={monthly.progress}
          text={monthly.progressText}
          tone={tone}
          ariaLabel={`Monthly mission ${monthly.name} progress`}
        />
      </div>

      <div className="ml-monthly__reward">
        <span className="ml-monthly__reward-value">{monthly.xp}</span>
        <span className="ml-monthly__reward-label">
          {monthly.state === 'completed' ? 'XP EARNED' : 'XP REWARD'}
        </span>
      </div>
    </div>
  );
}
