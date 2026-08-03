'use client';

/**
 * Four takes on the public profile — the page you land on from a leaderboard.
 *
 * All four answer the same brief: who is this person, how good are they, what
 * have their missions earned them, and what did they actually pick. They differ only
 * in what they lead with, because that is the real decision.
 */

import React from 'react';
import './user-profile-gallery.css';

// ---------------------------------------------------------------------------
// One sample, shared by every variant, so the layouts are what differ.
// ---------------------------------------------------------------------------

const USER = {
  name: 'ANDREWSILLO',
  memberSince: 'MAR 2026',
  rank: 3,
  ofUsers: 148,
  level: 12,
  title: 'RANKED',
  lifetimeXp: 214,
  xpIntoLevel: 9,
  xpForNextLevel: 27,
  currentStreak: 4,
  bestStreak: 9,
  totalPicks: 186,
  correct: 121,
  accuracy: 65,
  points: 402,
  missionsCompleted: 34,
  missionsAttempted: 41,
  perfectPicks: 18,
};

const MISSIONS = [
  { name: 'FIRST-ROUND SUB LOCK', tier: 'HARD', xp: 8, when: 'UFC 328' },
  { name: 'METHOD CYCLE', tier: 'HARD', xp: 8, when: 'UFC 327' },
  { name: 'WINNER DOUBLE', tier: 'MEDIUM', xp: 3, when: 'UFC 327' },
  { name: 'THREE FINISHES', tier: 'EASY', xp: 1, when: 'UFC 326' },
  { name: "JUDGES' NIGHT", tier: 'MEDIUM', xp: 5, when: 'UFC 326' },
];

const EVENTS = [
  { name: 'UFC 328: CHIMAEV VS. STRICKLAND', date: 'MAY 09, 2026', score: '7/8', acc: 88 },
  { name: 'UFC 327: PEREIRA VS. ULBERG', date: 'APR 18, 2026', score: '5/9', acc: 56 },
  { name: 'UFC 326: HOLLOWAY VS. OLIVEIRA 2', date: 'MAR 07, 2026', score: '9/11', acc: 82 },
  { name: 'UFC FIGHT NIGHT: ALLEN VS. COSTA', date: 'MAY 16, 2026', score: '6/10', acc: 60 },
];

const PICKS = [
  { red: 'KING GREEN', blue: 'TERRANCE MCKINNEY', pick: 'KING GREEN', pickM: 'KO/TKO', pickR: 1, res: 'TERRANCE MCKINNEY', resM: 'KO/TKO', resR: 1, state: 'wrong' },
  { red: 'TRACY CORTEZ', blue: 'WANG CONG', pick: 'TRACY CORTEZ', pickM: 'DEC', pickR: null, res: 'TRACY CORTEZ', resM: 'DEC', resR: null, state: 'perfect' },
  { red: 'JON JONES', blue: 'TOM ASPINALL', pick: 'JON JONES', pickM: 'KO/TKO', pickR: 2, res: 'JON JONES', resM: 'SUB', resR: 3, state: 'correct' },
];

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Meter({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="ug-meter" role="img" aria-label={`${value} of ${max} XP`}>
      <span className="ug-meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Avatar({ size }: { size: 'sm' | 'lg' }) {
  return <div className={`ug-avatar ug-avatar--${size}`}>{USER.name.charAt(0)}</div>;
}

function PicksTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ug-picks ${compact ? 'ug-picks--compact' : ''}`}>
      <div className="ug-picks__head">
        <span />
        <span>THEIR PICK</span>
        <span>RESULT</span>
        <span />
      </div>
      {PICKS.map((p) => (
        <div className={`ug-picks__row ug-picks__row--${p.state}`} key={p.red}>
          <span className="ug-picks__bout">
            <strong>{p.red}</strong> <em>vs</em> <strong>{p.blue}</strong>
          </span>
          <span className="ug-picks__cell">
            <b>{p.pick}</b>
            {p.pickR ? <i>RD {p.pickR}</i> : null}
            <u>{p.pickM}</u>
          </span>
          <span className="ug-picks__cell">
            <b>{p.res}</b>
            {p.resR ? <i>RD {p.resR}</i> : null}
            <u>{p.resM}</u>
          </span>
          <span className={`ug-badge ug-badge--${p.state}`}>
            {p.state === 'perfect' ? 'PERFECT' : p.state === 'correct' ? 'CORRECT' : 'WRONG'}
          </span>
        </div>
      ))}
    </div>
  );
}

function MissionChips() {
  return (
    <div className="ug-chips">
      {MISSIONS.map((m) => (
        <span className={`ug-chip ug-chip--${m.tier.toLowerCase()}`} key={m.name}>
          {m.name}
          <b>+{m.xp}</b>
        </span>
      ))}
    </div>
  );
}

function EventGrid() {
  return (
    <div className="ug-events">
      {EVENTS.map((e) => (
        <div className="ug-event" key={e.name}>
          <div className="ug-event__art">
            <span>UFC</span>
          </div>
          <div className="ug-event__meta">
            <span className="ug-event__date">{e.date}</span>
            <strong className="ug-event__name">{e.name}</strong>
            <span className="ug-event__score">
              {e.score} <i>{e.acc}% ACCURACY</i>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 01 — DOSSIER: identity rail on the left, everything else reads as a file.
// ---------------------------------------------------------------------------

function VariantDossier() {
  return (
    <div className="ug-dossier">
      <aside className="ug-dossier__rail">
        <Avatar size="lg" />
        <h3 className="ug-name">{USER.name}</h3>
        <span className="ug-sub">MEMBER SINCE {USER.memberSince}</span>
        <div className="ug-levelblock">
          <span className="ug-levelblock__num">{USER.level}</span>
          <span className="ug-levelblock__label">LEVEL</span>
          <span className="ug-title">{USER.title}</span>
        </div>
        <Meter value={USER.xpIntoLevel} max={USER.xpForNextLevel} />
        <span className="ug-sub">
          {USER.xpIntoLevel} / {USER.xpForNextLevel} XP TO LEVEL {USER.level + 1}
        </span>
        <div className="ug-rail-stats">
          <div><b>#{USER.rank}</b><i>GLOBAL RANK</i></div>
          <div><b>🔥{USER.currentStreak}</b><i>CARD STREAK</i></div>
          <div><b>{USER.lifetimeXp}</b><i>LIFETIME XP</i></div>
        </div>
      </aside>
      <div className="ug-dossier__body">
        <div className="ug-statrow">
          <div><b>{USER.totalPicks}</b><i>PICKS</i></div>
          <div><b>{USER.accuracy}%</b><i>ACCURACY</i></div>
          <div><b>{USER.points}</b><i>POINTS</i></div>
          <div><b>{USER.perfectPicks}</b><i>PERFECT</i></div>
        </div>
        <h4 className="ug-h">MISSIONS COMPLETED · {USER.missionsCompleted}/{USER.missionsAttempted}</h4>
        <MissionChips />
        <h4 className="ug-h">PICKS BY EVENT</h4>
        <EventGrid />
        <h4 className="ug-h">UFC 328 — EVERY PICK</h4>
        <PicksTable />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 02 — TALE OF THE TAPE: the level is the headline, like a fighter banner.
// ---------------------------------------------------------------------------

function VariantTape() {
  return (
    <div className="ug-tape">
      <div className="ug-tape__hero">
        <div className="ug-tape__left">
          <Avatar size="lg" />
          <div>
            <h3 className="ug-name ug-name--xl">{USER.name}</h3>
            <span className="ug-sub">
              RANK #{USER.rank} OF {USER.ofUsers} · MEMBER SINCE {USER.memberSince}
            </span>
          </div>
        </div>
        <div className="ug-tape__right">
          <span className="ug-tape__level">{USER.level}</span>
          <span className="ug-title ug-title--lg">{USER.title}</span>
          <Meter value={USER.xpIntoLevel} max={USER.xpForNextLevel} />
          <span className="ug-sub">{USER.lifetimeXp} LIFETIME XP</span>
        </div>
      </div>
      <div className="ug-tape__tape">
        {[
          ['ACCURACY', `${USER.accuracy}%`],
          ['PICKS', USER.totalPicks],
          ['CORRECT', USER.correct],
          ['PERFECT', USER.perfectPicks],
          ['MISSIONS', `${USER.missionsCompleted}`],
          ['BEST STREAK', `🔥${USER.bestStreak}`],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <b>{value}</b>
            <i>{label}</i>
          </div>
        ))}
      </div>
      <h4 className="ug-h">MISSIONS COMPLETED</h4>
      <MissionChips />
      <h4 className="ug-h">PICKS BY EVENT</h4>
      <EventGrid />
      <h4 className="ug-h">UFC 328 — EVERY PICK</h4>
      <PicksTable />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 03 — LADDER: rank first. For the profile you reach from a leaderboard.
// ---------------------------------------------------------------------------

function VariantLadder() {
  return (
    <div className="ug-ladder">
      <div className="ug-ladder__top">
        <span className="ug-ladder__rank">#{USER.rank}</span>
        <div className="ug-ladder__id">
          <div className="ug-ladder__idrow">
            <Avatar size="sm" />
            <h3 className="ug-name">{USER.name}</h3>
            <span className="ug-pill">
              LV {USER.level} · {USER.title}
            </span>
          </div>
          <Meter value={USER.xpIntoLevel} max={USER.xpForNextLevel} />
          <span className="ug-sub">
            {USER.lifetimeXp} XP · {USER.xpForNextLevel - USER.xpIntoLevel} TO LEVEL{' '}
            {USER.level + 1} · 🔥{USER.currentStreak} STREAK
          </span>
        </div>
        <div className="ug-ladder__acc">
          <b>{USER.accuracy}%</b>
          <i>ACCURACY</i>
        </div>
      </div>
      <div className="ug-ladder__split">
        <section>
          <h4 className="ug-h">MISSIONS · {USER.missionsCompleted} COMPLETED</h4>
          <div className="ug-list">
            {MISSIONS.map((m) => (
              <div className="ug-list__row" key={m.name}>
                <span className={`ug-tier ug-tier--${m.tier.toLowerCase()}`}>{m.tier.charAt(0)}</span>
                <span className="ug-list__name">{m.name}</span>
                <span className="ug-list__when">{m.when}</span>
                <span className="ug-list__xp">+{m.xp}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h4 className="ug-h">RECENT CARDS</h4>
          <div className="ug-list">
            {EVENTS.map((e) => (
              <div className="ug-list__row" key={e.name}>
                <span className="ug-list__name">{e.name}</span>
                <span className="ug-list__when">{e.date}</span>
                <span className="ug-list__xp">{e.score}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <h4 className="ug-h">UFC 328 — EVERY PICK</h4>
      <PicksTable compact />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 04 — TIMELINE: one card per row, missions earned attached to the card.
// ---------------------------------------------------------------------------

function VariantTimeline() {
  return (
    <div className="ug-timeline">
      <div className="ug-timeline__head">
        <Avatar size="lg" />
        <div>
          <h3 className="ug-name ug-name--xl">{USER.name}</h3>
          <span className="ug-sub">
            LEVEL {USER.level} · {USER.title} · {USER.lifetimeXp} XP · RANK #{USER.rank} ·{' '}
            {USER.accuracy}% ACCURACY
          </span>
          <Meter value={USER.xpIntoLevel} max={USER.xpForNextLevel} />
        </div>
        <div className="ug-timeline__badge">
          <b>{USER.missionsCompleted}</b>
          <i>MISSIONS</i>
        </div>
      </div>
      {EVENTS.map((event, index) => (
        <div className="ug-tl" key={event.name}>
          <div className="ug-tl__spine">
            <span className="ug-tl__dot" />
          </div>
          <div className="ug-tl__card">
            <div className="ug-tl__top">
              <div>
                <span className="ug-event__date">{event.date}</span>
                <strong className="ug-event__name">{event.name}</strong>
              </div>
              <span className="ug-tl__score">
                {event.score}
                <i>{event.acc}%</i>
              </span>
            </div>
            {index < 2 && (
              <div className="ug-chips ug-chips--tight">
                {MISSIONS.slice(index, index + 2).map((m) => (
                  <span className={`ug-chip ug-chip--${m.tier.toLowerCase()}`} key={m.name}>
                    {m.name}
                    <b>+{m.xp}</b>
                  </span>
                ))}
              </div>
            )}
            {index === 0 && <PicksTable compact />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

const VARIANTS = [
  {
    n: '01',
    name: 'DOSSIER',
    idea: 'Identity pinned to a left rail; the rest reads top to bottom like a file. Closest to the profile you already have.',
    render: <VariantDossier />,
  },
  {
    n: '02',
    name: 'TALE OF THE TAPE',
    idea: 'The level is the headline, opposite the name, the way a fight banner sets up two sides. Stats read as a tape.',
    render: <VariantTape />,
  },
  {
    n: '03',
    name: 'LADDER',
    idea: 'Rank first, because this page is usually reached from a leaderboard. Missions and cards sit side by side.',
    render: <VariantLadder />,
  },
  {
    n: '04',
    name: 'TIMELINE',
    idea: 'One row per card, with the missions earned attached to the card that earned them. Scales as history grows.',
    render: <VariantTimeline />,
  },
];

export function UserProfileGallery() {
  return (
    <div className="ug-page">
      <header className="ug-page__head">
        <h1 className="ug-page__title">PUBLIC PROFILE — {VARIANTS.length} OPTIONS</h1>
        <p className="ug-page__sub">
          Same person, same numbers, four layouts. Local only; nothing here is wired to
          the API and nothing links into the product.
        </p>
      </header>

      {VARIANTS.map((variant) => (
        <section className="ug-section" key={variant.n}>
          <div className="ug-section__head">
            <span className="ug-section__n">{variant.n}</span>
            <h2 className="ug-section__name">{variant.name}</h2>
            <p className="ug-section__idea">{variant.idea}</p>
          </div>
          <div className="ug-frame">{variant.render}</div>
        </section>
      ))}
    </div>
  );
}
