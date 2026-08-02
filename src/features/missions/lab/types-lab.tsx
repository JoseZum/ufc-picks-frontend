'use client';

/**
 * FE-000A — every mission interaction shape on one page (dev-only review aid).
 *
 * Renders each distinct picker configuration live, inside a drawer-width plate,
 * so the five families and their variants can be judged side by side without
 * opening ten drawers. Uses the real pickers and the real offer data, so what
 * is shown here is exactly what the drawer renders.
 */

import React from 'react';
import { V2Layout } from '@/components/design-system-v2/V2Layout';
import { NavBarV2 } from '@/components/design-system-v2/NavBarV2';
import { MobileNav } from '@/components/design-system-v2/MobileNav';
import '../missions.css';
import './types-lab.css';

import type {
  ActiveMissionVM,
  MissionOffer,
  MockSelection,
} from '../contracts/mission-mock-models';
import {
  LAB_BOUTS,
  SLOT_1_OFFERS,
  SLOT_2_OFFERS,
  SLOT_3_OFFERS,
} from '../fixtures/mission-scenarios';
import { MISSION_PICKERS, isDraftComplete } from '../renderers/pickers';
import { instructionLabelFor } from '../renderers/instruction-copy';
import { DifficultyBadge, MissionCard } from '../components/mission-shared';

const ALL_OFFERS = [...SLOT_1_OFFERS, ...SLOT_2_OFFERS, ...SLOT_3_OFFERS];
const byId = (id: string) => ALL_OFFERS.find((o) => o.offerId === id)!;

/**
 * Offer variants the catalog contains but the three lab slots do not, so every
 * distinct picker shape is on screen. Same shapes, different configuration.
 */
const EXTRA_OFFERS: MissionOffer[] = [
  {
    offerId: 'x-method-only',
    missionId: 'CARD-V2-M-002',
    interaction: 'TARGET_FIGHTER',
    name: 'KO LOCK',
    description: 'Choose one fighter to win by KO/TKO.',
    difficulty: 'MEDIUM',
    xp: 3,
    progressTemplate: '{result} / KO win',
    selectionPrompt: 'Choose a fighter and a win method',
    requiresMethod: true,
  },
  {
    offerId: 'x-round-ladder',
    missionId: 'CARD-V2-H-011',
    interaction: 'COMBO_BUILDER',
    name: 'ROUND LADDER',
    description: 'Build a 3-leg combo with one winner in each round.',
    difficulty: 'HARD',
    xp: 12,
    progressTemplate: '{current} / 3 rungs',
    selectionPrompt: 'Choose one winner for each round',
    legCount: 3,
    legRule: 'One R1 finish, one R2 finish, one R3 finish.',
    legLabels: ['ROUND 1', 'ROUND 2', 'ROUND 3'],
  },
  {
    offerId: 'x-displayed-line',
    missionId: 'CARD-V3-M-004',
    interaction: 'CARD_PROP',
    name: 'OVER THE LINE',
    description: 'The card must go over the displayed finish line.',
    difficulty: 'MEDIUM',
    xp: 4,
    progressTemplate: '{current} / line {target}',
    selectionPrompt: 'Accept the displayed line',
    propKind: 'accept',
    displayedTarget: 4,
  },
  {
    offerId: 'x-exact-decisions',
    missionId: 'CARD-V3-H-002',
    interaction: 'CARD_PROP',
    name: 'EXACT DECISION COUNT',
    description: 'Choose the exact number of fights that go to a decision.',
    difficulty: 'HARD',
    xp: 9,
    progressTemplate: '{current} decisions / target {target}',
    selectionPrompt: 'Choose the exact decision count',
    propKind: 'exact-count',
    maxCount: 7,
    countUnit: 'DECISIONS',
  },
];

const CASES: { label: string; note: string; offer: MissionOffer }[] = [
  {
    label: 'AUTO',
    note: 'Nothing to choose. The mission is tracked from picks and results; accepting is the only decision.',
    offer: byId('off-1-easy'),
  },
  {
    label: 'TARGET FIGHTER · plain',
    note: 'One fighter from the card. No method, no round.',
    offer: byId('off-1-med'),
  },
  {
    label: 'TARGET FIGHTER · + method',
    note: 'Fighter plus win method. All three methods are offered because no exact round is required.',
    offer: EXTRA_OFFERS[0],
  },
  {
    label: 'TARGET FIGHTER · + method + round',
    note: 'EXACT SCRIPT. Decision is never offered (a decision has no finishing round), and the round options follow the bout length: 1–5 in the main event, 1–3 elsewhere.',
    offer: byId('off-1-hard'),
  },
  {
    label: 'TARGET FIGHT',
    note: 'A whole bout instead of a fighter, with both faces on the row.',
    offer: byId('off-2-med'),
  },
  {
    label: 'COMBO BUILDER · 2 legs',
    note: 'Two fighters, no per-leg roles. The badge shows LEG 1 / LEG 2 as they fill.',
    offer: byId('off-3-med'),
  },
  {
    label: 'COMBO BUILDER · 3 legs, labelled',
    note: 'Each leg carries a role from the catalog, so the badge shows KO/TKO, SUBMISSION, DECISION.',
    offer: byId('off-3-hard'),
  },
  {
    label: 'COMBO BUILDER · 3 legs, rounds',
    note: 'Same shape, different labels: the roles are rounds instead of methods.',
    offer: EXTRA_OFFERS[1],
  },
  {
    label: 'CARD PROP · accept',
    note: 'Nothing to configure; the prop is a yes.',
    offer: byId('off-3-easy'),
  },
  {
    label: 'CARD PROP · accept a displayed line',
    note: 'Same shape, but the frozen target from the offer is stated before you accept.',
    offer: EXTRA_OFFERS[2],
  },
  {
    label: 'CARD PROP · A / B choice',
    note: 'Two lanes, one tap.',
    offer: byId('off-2-easy'),
  },
  {
    label: 'CARD PROP · exact count',
    note: 'Stepper against the card ceiling. The count now reads 4 / 7 FINISHES as it moves.',
    offer: byId('off-2-hard'),
  },
  {
    label: 'CARD PROP · exact count, other unit',
    note: 'Same stepper with a different noun, to check the unit travels as data.',
    offer: EXTRA_OFFERS[3],
  },
];

/* ------------------------------------------------------------------ active */

/** Mirrors the gateway: the surface never resolves a fighter itself. */
function hydrate(mission: ActiveMissionVM): ActiveMissionVM {
  if (!mission.targetBoutId) return mission;
  const bout = LAB_BOUTS.find((b) => b.id === mission.targetBoutId);
  if (!bout) return { ...mission, targetFighter: null };
  return { ...mission, targetFighter: mission.targetCorner === 'blue' ? bout.blue : bout.red };
}

const MAIN = LAB_BOUTS[0];
const CO_MAIN = LAB_BOUTS[1];
const THIRD = LAB_BOUTS[2];

/** One active card per interaction shape, in the state it spends most time in. */
const ACTIVE_CASES: { label: string; note: string; mission: ActiveMissionVM }[] = [
  {
    label: 'AUTO · waiting',
    note: 'No selection to show, and no fraction to count yet: the card carries a sentence.',
    mission: {
      missionId: 'CARD-V2-E-004',
      name: 'HEADLINER READ',
      interaction: 'AUTO',
      difficulty: 'EASY',
      xp: 1,
      progressText: 'Awaiting first result',
      progressPct: 0,
      status: 'ACTIVE',
    },
  },
  {
    label: 'AUTO · counting',
    note: 'Once results land the same card counts: the achieved number takes the status colour.',
    mission: {
      missionId: 'CARD-V2-E-006',
      name: 'TWO ON THE BOARD',
      interaction: 'AUTO',
      difficulty: 'EASY',
      xp: 1,
      progressText: '1 / 2 winners',
      progress: { current: 1, total: 2, unit: 'WINNERS' },
      progressPct: 50,
      status: 'ACTIVE',
    },
  },
  {
    label: 'TARGET FIGHTER · plain',
    note: 'One role, one name, one face.',
    mission: {
      missionId: 'CARD-V2-H-001',
      name: 'SUBMISSION LOCK',
      interaction: 'TARGET_FIGHTER',
      difficulty: 'MEDIUM',
      xp: 4,
      selection: [{ label: 'Target', value: 'Uroš Medić' }],
      targetBoutId: MAIN.id,
      targetCorner: 'red',
      progressText: 'Awaiting result',
      progressPct: 0,
      status: 'ACTIVE',
    },
  },
  {
    label: 'TARGET FIGHTER · + method',
    note: 'Two parts on the line. Watch that the second one does not push the card taller.',
    mission: {
      missionId: 'CARD-V2-M-002',
      name: 'KO LOCK',
      interaction: 'TARGET_FIGHTER',
      difficulty: 'MEDIUM',
      xp: 3,
      selection: [
        { label: 'Target', value: 'Aleksandar Rakic' },
        { label: 'Method', value: 'KO/TKO' },
      ],
      targetBoutId: THIRD.id,
      targetCorner: 'red',
      progressText: 'Awaiting result',
      progressPct: 0,
      status: 'ACTIVE',
    },
  },
  {
    label: 'TARGET FIGHTER · + method + round',
    note: 'The longest selection of all: three parts plus a counting progress.',
    mission: {
      missionId: 'CARD-V2-H-003',
      name: 'EXACT SCRIPT',
      interaction: 'TARGET_FIGHTER',
      difficulty: 'HARD',
      xp: 6,
      selection: [
        { label: 'Target', value: 'Uroš Medić' },
        { label: 'Method', value: 'Submission' },
        { label: 'Round', value: 'R1' },
      ],
      targetBoutId: MAIN.id,
      targetCorner: 'red',
      progressText: '1 / 3 conditions',
      progress: { current: 1, total: 3, unit: 'CONDITIONS' },
      progressPct: 33,
      status: 'ACTIVE',
    },
  },
  {
    label: 'TARGET FIGHT',
    note: 'The pick is a bout, so the value is two names. Only the red corner gets a face.',
    mission: {
      missionId: 'CARD-V2-M-001',
      name: 'FINISH LOCK',
      interaction: 'TARGET_FIGHT',
      difficulty: 'MEDIUM',
      xp: 3,
      selection: [{ label: 'Fight', value: 'Jan Blachowicz vs Navajo Stirling' }],
      targetBoutId: CO_MAIN.id,
      targetCorner: 'red',
      progressText: 'Awaiting result',
      progressPct: 0,
      status: 'ACTIVE',
    },
  },
  {
    label: 'COMBO · 2 legs',
    note: 'Two legs with generic roles.',
    mission: {
      missionId: 'CARD-V2-M-011',
      name: 'WINNER DOUBLE',
      interaction: 'COMBO_BUILDER',
      difficulty: 'MEDIUM',
      xp: 3,
      selection: [
        { label: 'Leg 1', value: 'Uroš Medić' },
        { label: 'Leg 2', value: 'Marcin Tybura' },
      ],
      targetBoutId: MAIN.id,
      targetCorner: 'red',
      progressText: '1 / 2 legs',
      progress: { current: 1, total: 2, unit: 'LEGS' },
      progressPct: 50,
      status: 'ACTIVE',
    },
  },
  {
    label: 'COMBO · 3 legs, methods',
    note: 'Three legs is where the selection line wraps. This is the density limit of the card.',
    mission: {
      missionId: 'CARD-V2-H-007',
      name: 'METHOD CYCLE',
      interaction: 'COMBO_BUILDER',
      difficulty: 'HARD',
      xp: 8,
      selection: [
        { label: 'KO', value: 'Rakic' },
        { label: 'SUB', value: 'Klein' },
        { label: 'DEC', value: 'Elliott' },
      ],
      targetBoutId: THIRD.id,
      targetCorner: 'red',
      progressText: '2 / 3 cycle legs',
      progress: { current: 2, total: 3, unit: 'CYCLE LEGS' },
      progressPct: 67,
      status: 'ONE_TO_GO',
    },
  },
  {
    label: 'COMBO · 3 legs, rounds',
    note: 'Same shape with round roles instead of methods.',
    mission: {
      missionId: 'CARD-V2-H-011',
      name: 'ROUND LADDER',
      interaction: 'COMBO_BUILDER',
      difficulty: 'HARD',
      xp: 12,
      selection: [
        { label: 'R1', value: 'Medić' },
        { label: 'R2', value: 'Rakic' },
        { label: 'R3', value: 'Todorović' },
      ],
      targetBoutId: MAIN.id,
      targetCorner: 'red',
      progressText: '0 / 3 rungs',
      progress: { current: 0, total: 3, unit: 'RUNGS' },
      progressPct: 0,
      status: 'ACTIVE',
    },
  },
  {
    label: 'CARD PROP · accepted',
    note: 'No face and no name: a card prop belongs to the whole event.',
    mission: {
      missionId: 'CARD-V2-E-012',
      name: 'THREE FINISHES',
      interaction: 'CARD_PROP',
      difficulty: 'EASY',
      xp: 1,
      progressText: '2 / 3 finishes',
      progress: { current: 2, total: 3, unit: 'FINISHES' },
      progressPct: 67,
      status: 'ONE_TO_GO',
    },
  },
  {
    label: 'CARD PROP · displayed line',
    note: 'The frozen line travels as part of the selection so the user can see what they accepted.',
    mission: {
      missionId: 'CARD-V3-M-004',
      name: 'OVER THE LINE',
      interaction: 'CARD_PROP',
      difficulty: 'MEDIUM',
      xp: 4,
      selection: [{ label: 'Line', value: 'Over 4' }],
      progressText: '3 / 4 finishes',
      progress: { current: 3, total: 4, unit: 'FINISHES' },
      progressPct: 75,
      status: 'ONE_TO_GO',
    },
  },
  {
    label: 'CARD PROP · A / B choice',
    note: 'The lane you took, and a progress that is a comparison rather than a fraction.',
    mission: {
      missionId: 'CARD-V3-E-008',
      name: 'PICK A LANE',
      interaction: 'CARD_PROP',
      difficulty: 'EASY',
      xp: 2,
      selection: [{ label: 'Your lane', value: 'FINISHES' }],
      progressText: 'Finishes 2 · Decisions 1',
      progressCompare: [
        { label: 'Finishes', value: 2 },
        { label: 'Decisions', value: 1 },
      ],
      progressPct: 60,
      status: 'ACTIVE',
    },
  },
  {
    label: 'CARD PROP · exact count',
    note: 'The call is a number, and the progress counts towards it.',
    mission: {
      missionId: 'CARD-V2-H-019',
      name: 'EXACT FINISH COUNT',
      interaction: 'CARD_PROP',
      difficulty: 'HARD',
      xp: 10,
      selection: [{ label: 'Your call', value: 'Exactly 4' }],
      progressText: '3 / 4 finishes',
      progress: { current: 3, total: 4, unit: 'FINISHES' },
      progressPct: 75,
      status: 'ONE_TO_GO',
    },
  },
];

function Case({ label, note, offer }: { label: string; note: string; offer: MissionOffer }) {
  const [draft, setDraft] = React.useState<MockSelection | null>(null);
  const Picker = MISSION_PICKERS[offer.interaction];
  const ready = isDraftComplete(offer, draft);
  const label2 = instructionLabelFor(offer.selectionPrompt, offer.description);

  return (
    <article className="mlt-case">
      <div className="mlt-case__head">
        <h2 className="mlt-case__label">{label}</h2>
        <span className={`mlt-case__state ${ready ? 'mlt-case__state--on' : ''}`}>
          {ready ? 'CONTINUE ENABLED' : 'INCOMPLETE'}
        </span>
      </div>
      <p className="mlt-case__note">{note}</p>

      <div className="mlt-case__plate">
        <span className="ml-drawer__eyebrow">
          {offer.interaction.replace('_', ' ')}
        </span>
        <h3 className="ml-drawer__title">{offer.name}</h3>
        <div className="ml-drawer__meta">
          <DifficultyBadge difficulty={offer.difficulty} />
          <span className="ml-monthly__xp">{offer.xp} XP</span>
        </div>

        {label2 ? <span className="ml-drawer__section-label">{label2}</span> : null}
        {offer.interaction === 'COMBO_BUILDER' ? null : (
          <p className="ml-leg-status">
            <span>{offer.description}</span>
          </p>
        )}
        <Picker offer={offer} bouts={LAB_BOUTS} draft={draft} onDraft={setDraft} />
      </div>
    </article>
  );
}

export function TypesLab() {
  return (
    <V2Layout>
      <NavBarV2 />
      <main
        className="main"
        style={{ paddingTop: '90px', paddingBottom: '5rem', maxWidth: '1200px' }}
      >
        <div className="ml-lab-bar">
          <span className="ml-lab-bar__tag">MISSION TYPES · DEV ONLY · ALL INTERACTIONS</span>
          <a className="ml-btn" href="/mission-lab">
            Back to Mission Lab
          </a>
        </div>

        <section className="ml-section">
          <div className="ml-section__header">
            <h1 className="ml-section__title">EVERY MISSION TYPE</h1>
            <span className="ml-lab-bar__hint">
              The real pickers, live. The badge on each block says whether Continue would be
              enabled.
            </span>
          </div>

          <div className="mlt-grid">
            {CASES.map((c) => (
              <Case key={c.offer.offerId + c.label} {...c} />
            ))}
          </div>
        </section>

        <section className="ml-section">
          <div className="ml-section__header">
            <h2 className="ml-section__title">ONCE ACTIVE</h2>
            <span className="ml-lab-bar__hint">
              The same missions after they are locked in, in the real slot card.
            </span>
          </div>

          <div className="mlt-active">
            {ACTIVE_CASES.map((c, i) => (
              <article className="mlt-active__item" key={c.mission.missionId + c.label}>
                <h3 className="mlt-case__label">{c.label}</h3>
                <p className="mlt-case__note">{c.note}</p>
                <div
                  className={`ml-slot ml-slot--${c.mission.status.toLowerCase().replace('_', '-')}`}
                  data-num={String(i + 1).padStart(2, '0')}
                >
                  <span className="ml-slot__label">MISSION {String((i % 3) + 1).padStart(2, '0')}</span>
                  <MissionCard mission={hydrate(c.mission)} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <MobileNav />
    </V2Layout>
  );
}
