/**
 * FE-000A Mission Lab — deterministic scenario fixtures.
 *
 * Every value below is static and pre-resolved. Fighters/imagery reference the
 * real UFC Fight Night: Medić vs. Rodriguez card through the existing image
 * pipeline (FighterImage handles fallbacks). Milos Janicic legitimately has no
 * photo upstream, so the missing-imagery scenario exercises the real
 * placeholder path — that is intentional, not a broken fixture.
 */

import type { Fighter } from '@/lib/api';
import type {
  ActiveMissionVM,
  AdminMissionsVM,
  HomeMissionsVM,
  LabBout,
  LabEventContext,
  MissionOffer,
  MonthlyVM,
  ProfileMissionHubVM,
} from '../contracts/mission-mock-models';

// ---------------------------------------------------------------------------
// Real card context (captured once from the existing events API; static here)
// ---------------------------------------------------------------------------

const fighter = (
  name: string,
  corner: 'red' | 'blue',
  img: string | null,
  record: [number, number, number],
  nationality: string,
  nickname?: string
): Fighter => ({
  fighter_name: name,
  corner,
  profile_image_url: img ?? undefined,
  record_at_fight: { wins: record[0], losses: record[1], draws: record[2] },
  nationality,
  nickname,
});

const ESPN = 'https://a.espncdn.com/i/headshots/mma/players/full';

export const LAB_BOUTS: LabBout[] = [
  {
    id: 1139707,
    weightClass: 'Welterweight',
    section: 'main',
    isMainEvent: true,
    roundsScheduled: 5,
    red: fighter('Uroš Medić', 'red', `${ESPN}/4685870.png`, [13, 3, 0], 'Serbia', 'The Doctor'),
    blue: fighter('Daniel Rodriguez', 'blue', `${ESPN}/4426312.png`, [20, 5, 0], 'USA', 'D-Rod'),
  },
  {
    id: 11556033684,
    weightClass: 'Light Heavyweight',
    section: 'main',
    isCoMain: true,
    roundsScheduled: 3,
    red: fighter('Jan Blachowicz', 'red', `${ESPN}/2506250.png`, [29, 11, 2], 'Poland'),
    blue: fighter('Navajo Stirling', 'blue', `${ESPN}/5216713.png`, [10, 0, 0], 'New Zealand'),
  },
  {
    id: 1139708,
    weightClass: 'Heavyweight',
    section: 'main',
    roundsScheduled: 3,
    red: fighter('Aleksandar Rakic', 'red', `${ESPN}/4079314.png`, [14, 6, 0], 'Serbia', 'Rocket'),
    blue: fighter('Marcin Tybura', 'blue', `${ESPN}/3093559.png`, [27, 11, 0], 'Poland', 'Tybur'),
  },
  {
    id: 1136494,
    weightClass: 'Middleweight',
    section: 'main',
    roundsScheduled: 3,
    red: fighter('Duško Todorović', 'red', `${ESPN}/4421517.png`, [13, 6, 0], 'Serbia', 'Thunder'),
    blue: fighter('Robert Valentin', 'blue', `${ESPN}/4686237.png`, [12, 6, 0], 'Switzerland', 'Robzilla'),
  },
  {
    id: 401902574,
    weightClass: 'Lightweight',
    section: 'main',
    roundsScheduled: 3,
    // Real upstream gap: no photo for Janicic → placeholder path on purpose.
    red: fighter('Milos Janicic', 'red', null, [19, 3, 0], 'Montenegro', 'Cobra'),
    blue: fighter('Noah Gugnon', 'blue', `${ESPN}/5145777.png`, [9, 2, 0], 'France'),
  },
  {
    id: 1141659,
    weightClass: 'Lightweight',
    section: 'prelim',
    roundsScheduled: 3,
    red: fighter('Ludovit Klein', 'red', `${ESPN}/4193694.png`, [24, 5, 1], 'Slovakia', 'Mr. Highlight'),
    blue: fighter('Tofiq Musayev', 'blue', `${ESPN}/4423264.png`, [23, 6, 0], 'Azerbaijan'),
  },
  {
    id: 1145152,
    weightClass: 'Welterweight',
    section: 'prelim',
    roundsScheduled: 3,
    red: fighter('Oban Elliott', 'red', `${ESPN}/4900808.png`, [12, 4, 0], 'Wales', 'The Welsh Gangster'),
    blue: fighter('Michael Oliveira', 'blue', `${ESPN}/5282411.png`, [9, 0, 0], 'Brazil', 'PQD'),
  },
];

export const LAB_EVENT: LabEventContext = {
  eventId: 142997,
  eventName: 'UFC Fight Night: Medić vs. Rodriguez',
  // Same official hero art the Home/event hero already renders.
  eventImageUrl:
    'https://ufc.com/images/styles/background_image_xl_2x/s3/2026-07/080126-ufc-fight-night-medic-vs-rodriguez-EVENT-ART.jpg?h=d1cb525d&itok=w4xZl0_o',
  bouts: LAB_BOUTS,
};

// ---------------------------------------------------------------------------
// Offers per slot (three real catalog missions per slot: easy/medium/hard)
// ---------------------------------------------------------------------------

export const SLOT_1_OFFERS: MissionOffer[] = [
  {
    offerId: 'off-1-easy',
    missionId: 'CARD-V2-E-004',
    interaction: 'AUTO',
    name: 'HEADLINER READ',
    description: 'Correctly predict the main-event winner.',
    difficulty: 'EASY',
    xp: 1,
    progressTemplate: '{current} / 1',
  },
  {
    offerId: 'off-1-med',
    missionId: 'CARD-V2-H-001',
    interaction: 'TARGET_FIGHTER',
    name: 'SUBMISSION LOCK',
    description: 'Choose one fighter to win by submission.',
    difficulty: 'MEDIUM',
    xp: 4,
    progressTemplate: '{result} / submission win',
    selectionPrompt: 'Choose one fighter to win by submission',
  },
  {
    offerId: 'off-1-hard',
    missionId: 'CARD-V2-H-003',
    interaction: 'TARGET_FIGHTER',
    name: 'EXACT SCRIPT',
    description: 'Choose a fighter, win method and exact round; all must be correct.',
    difficulty: 'HARD',
    xp: 6,
    progressTemplate: '{matched} / 3 conditions',
    selectionPrompt: 'Choose fighter, method and round',
    requiresMethod: true,
    requiresRound: true,
    // A decision has no finishing round, so this definition excludes it.
    allowedMethods: ['KO/TKO', 'Submission'],
  },
];

export const SLOT_2_OFFERS: MissionOffer[] = [
  {
    offerId: 'off-2-easy',
    missionId: 'CARD-V3-E-008',
    interaction: 'CARD_PROP',
    name: 'PICK A LANE',
    description:
      'Choose FINISHES or DECISIONS. Your side must be at least as common on the card; a tie also completes the mission.',
    difficulty: 'EASY',
    xp: 2,
    progressTemplate: '{selected_count} vs {other_count}',
    selectionPrompt: 'Choose FINISHES or DECISIONS',
    propKind: 'choice',
    choices: ['FINISHES', 'DECISIONS'],
  },
  {
    offerId: 'off-2-med',
    missionId: 'CARD-V2-M-001',
    interaction: 'TARGET_FIGHT',
    name: 'FINISH LOCK',
    description: 'Choose one fight you are certain will end before a decision.',
    difficulty: 'MEDIUM',
    xp: 3,
    progressTemplate: '{result} / finish',
    selectionPrompt: 'Choose one fight to finish',
  },
  {
    offerId: 'off-2-hard',
    missionId: 'CARD-V2-H-019',
    interaction: 'CARD_PROP',
    name: 'EXACT FINISH COUNT',
    description: 'Choose the exact number of finishes that will occur on the card.',
    difficulty: 'HARD',
    xp: 10,
    progressTemplate: '{current} finishes / target {target}',
    selectionPrompt: 'Choose the exact finish count',
    propKind: 'exact-count',
    maxCount: 7,
    countUnit: 'FINISHES',
  },
];

export const SLOT_3_OFFERS: MissionOffer[] = [
  {
    offerId: 'off-3-easy',
    missionId: 'CARD-V2-E-012',
    interaction: 'CARD_PROP',
    name: 'THREE FINISHES',
    description: 'The card must contain at least 3 finishes.',
    difficulty: 'EASY',
    xp: 1,
    progressTemplate: '{current} / 3 finishes',
    selectionPrompt: 'Accept the ≥3 finishes card prop',
    propKind: 'accept',
  },
  {
    offerId: 'off-3-med',
    missionId: 'CARD-V2-M-011',
    interaction: 'COMBO_BUILDER',
    name: 'WINNER DOUBLE',
    description: 'Build a 2-fighter combo; both fighters must win.',
    difficulty: 'MEDIUM',
    xp: 3,
    progressTemplate: '{current} / 2 legs',
    selectionPrompt: 'Choose 2 fighters to win',
    legCount: 2,
    legRule: 'Pick two different fighters. Both must win.',
  },
  {
    offerId: 'off-3-hard',
    missionId: 'CARD-V2-H-007',
    interaction: 'COMBO_BUILDER',
    name: 'METHOD CYCLE',
    description: 'Build a 3-leg combo: one KO/TKO, one submission and one decision; all must win.',
    difficulty: 'HARD',
    xp: 8,
    progressTemplate: '{current} / 3 cycle legs',
    selectionPrompt: 'Choose one KO, one SUB and one DEC winner',
    legCount: 3,
    legRule: 'One KO/TKO leg, one Submission leg, one Decision leg.',
    legLabels: ['KO/TKO', 'SUBMISSION', 'DECISION'],
  },
];

// ---------------------------------------------------------------------------
// Active/settled mission examples
// ---------------------------------------------------------------------------

export const ACTIVE_BANKER: ActiveMissionVM = {
  missionId: 'CARD-V2-E-001',
  name: 'BANKER LOCK',
  description: 'Pick one fighter you are sure about. They must win, any method.',
  interaction: 'TARGET_FIGHTER',
  difficulty: 'EASY',
  xp: 1,
  selectionSummary: 'Banker: Uroš Medić',
  selection: [{ label: 'Banker', value: 'Uroš Medić' }],
  targetBoutId: 1139707,
  targetCorner: 'red',
  progressText: 'Awaiting result',
  progressPct: 0,
  status: 'ACTIVE',
};

export const ACTIVE_COMBO_PARTIAL: ActiveMissionVM = {
  missionId: 'CARD-V2-H-007',
  name: 'METHOD CYCLE',
  description:
    'Win one fight by KO/TKO, one by submission and one by decision — one leg of each.',
  interaction: 'COMBO_BUILDER',
  difficulty: 'HARD',
  xp: 8,
  // Shaped like the wire: the fighter is the choice and the method rides along
  // as a quieter qualifier, already spelled for display.
  selectionSummary: 'Rakic KO/TKO · Klein Submission · Elliott Decision',
  selection: [
    { value: 'Rakic', detail: 'KO/TKO' },
    { value: 'Klein', detail: 'Submission' },
    { value: 'Elliott', detail: 'Decision' },
  ],
  targetBoutId: 1139708,
  targetCorner: 'red',
  progressText: '2 / 3 cycle legs',
  progress: { current: 2, total: 3, unit: 'CYCLE LEGS' },
  progressPct: 67,
  status: 'ONE_TO_GO',
};

export const SETTLED_COMPLETED: ActiveMissionVM = {
  missionId: 'CARD-V2-E-006',
  name: 'TWO ON THE BOARD',
  description: 'Get two of your picked winners right on this card.',
  interaction: 'AUTO',
  difficulty: 'EASY',
  xp: 1,
  progressText: '2 / 2 winners',
  progress: { current: 2, total: 2, unit: 'WINNERS' },
  progressPct: 100,
  status: 'COMPLETED',
  earnedXp: 1,
};

export const SETTLED_FAILED: ActiveMissionVM = {
  missionId: 'CARD-V2-M-004',
  name: 'FIRST-ROUND FIRE',
  description: 'Your chosen fighter must win by KO/TKO in round one.',
  interaction: 'TARGET_FIGHT',
  difficulty: 'MEDIUM',
  xp: 3,
  selectionSummary: 'Fight: Rakic vs Tybura',
  selection: [{ label: 'Fight', value: 'Rakic vs Tybura' }],
  targetBoutId: 1139708,
  targetCorner: 'red',
  progressText: 'Ended in round 3, target was R1',
  progressPct: 100,
  status: 'FAILED',
};

export const SETTLED_VOID: ActiveMissionVM = {
  missionId: 'CARD-V2-M-002',
  name: 'KO LOCK',
  description: 'Your chosen fighter must win by KO/TKO, any round.',
  interaction: 'TARGET_FIGHTER',
  difficulty: 'MEDIUM',
  xp: 3,
  selectionSummary: 'KO pick: Milos Janicic',
  selection: [{ label: 'KO', value: 'Milos Janicic' }],
  targetBoutId: 401902574,
  targetCorner: 'red',
  progressText: 'VOID · no XP',
  progressPct: 0,
  status: 'VOID',
  voidReason: 'Bout cancelled after selection',
};

// ---------------------------------------------------------------------------
// Monthly variants
// ---------------------------------------------------------------------------

export const MONTHLY_ACTIVE: MonthlyVM = {
  state: 'active',
  monthLabel: 'AUGUST 2026',
  name: 'WIN TARGET',
  description: 'Correctly predict at least 15 fight winners across all cards this month.',
  progressText: '9 / 15 winners',
  progress: { current: 9, total: 15, unit: 'WINNERS' },
  progressPct: 60,
  xp: 15,
};

export const MONTHLY_NEAR: MonthlyVM = {
  state: 'near-completion',
  monthLabel: 'AUGUST 2026',
  name: 'WIN TARGET',
  description: 'Correctly predict at least 15 fight winners across all cards this month.',
  progressText: '14 / 15 winners',
  progress: { current: 14, total: 15, unit: 'WINNERS' },
  progressPct: 93,
  xp: 15,
};

export const MONTHLY_COMPLETED: MonthlyVM = {
  state: 'completed',
  monthLabel: 'AUGUST 2026',
  name: 'WIN TARGET',
  description: 'Correctly predict at least 15 fight winners across all cards this month.',
  progressText: '15 / 15 winners · +15 XP earned',
  progress: { current: 15, total: 15, unit: 'WINNERS' },
  progressPct: 100,
  xp: 15,
};

export const MONTHLY_NOT_CONFIGURED: MonthlyVM = {
  state: 'not-configured',
  monthLabel: 'SEPTEMBER 2026',
};

export const MONTHLY_CLOSED: MonthlyVM = {
  state: 'month-closed',
  monthLabel: 'JULY 2026',
  name: 'METHOD MASTER',
  finalText: 'Month closed. Finished 6 / 8 method hits',
};

// ---------------------------------------------------------------------------
// Home scenarios
// ---------------------------------------------------------------------------

const openSlots = (): HomeMissionsVM => ({
  event: LAB_EVENT,
  lockLabel: 'MISSIONS LOCK IN 01D 04H 12M',
  monthly: MONTHLY_ACTIVE,
  slots: [
    { slot: 1, state: 'open', offers: SLOT_1_OFFERS },
    { slot: 2, state: 'open', offers: SLOT_2_OFFERS },
    { slot: 3, state: 'open', offers: SLOT_3_OFFERS },
  ],
});

export const HOME_SCENARIOS: Record<string, HomeMissionsVM> = {
  'home-open': openSlots(),
  'home-mixed': {
    event: LAB_EVENT,
    lockLabel: 'MISSIONS LOCK IN 01D 04H 12M',
    monthly: MONTHLY_ACTIVE,
    slots: [
      { slot: 1, state: 'active', mission: ACTIVE_BANKER },
      { slot: 2, state: 'open', offers: SLOT_2_OFFERS },
      { slot: 3, state: 'locked', reason: 'picks-closed' },
    ],
  },
  'home-locked': {
    event: LAB_EVENT,
    lockLabel: 'MISSIONS LOCKED',
    monthly: MONTHLY_NEAR,
    slots: [
      { slot: 1, state: 'locked', reason: 'picks-closed' },
      { slot: 2, state: 'locked', reason: 'admin-closed' },
      { slot: 3, state: 'locked', reason: 'results-started' },
    ],
  },
  'home-settled': {
    event: LAB_EVENT,
    lockLabel: 'CARD COMPLETE',
    monthly: MONTHLY_COMPLETED,
    slots: [
      { slot: 1, state: 'settled', mission: SETTLED_COMPLETED },
      { slot: 2, state: 'settled', mission: SETTLED_FAILED },
      { slot: 3, state: 'settled', mission: SETTLED_VOID },
    ],
  },
  'home-no-offers': {
    event: LAB_EVENT,
    lockLabel: 'OFFERS NOT DRAWN YET',
    monthly: MONTHLY_NOT_CONFIGURED,
    slots: [
      { slot: 1, state: 'no-offers' },
      { slot: 2, state: 'no-offers' },
      { slot: 3, state: 'no-offers' },
    ],
  },
  'home-month-closed': {
    event: LAB_EVENT,
    lockLabel: 'MISSIONS LOCK IN 01D 04H 12M',
    monthly: MONTHLY_CLOSED,
    slots: [
      { slot: 1, state: 'open', offers: SLOT_1_OFFERS },
      { slot: 2, state: 'active', mission: ACTIVE_COMBO_PARTIAL },
      { slot: 3, state: 'open', offers: SLOT_3_OFFERS },
    ],
  },
};

// ---------------------------------------------------------------------------
// Profile scenarios
// ---------------------------------------------------------------------------

const HISTORY_MIXED = [
  { missionName: 'TWO ON THE BOARD', eventLabel: 'UFC FN: Medić vs. Rodriguez', difficulty: 'EASY', status: 'COMPLETED', xp: 1 },
  { missionName: 'METHOD CYCLE', eventLabel: 'UFC FN: Medić vs. Rodriguez', difficulty: 'HARD', status: 'FAILED', xp: 0 },
  { missionName: 'KO LOCK', eventLabel: 'UFC FN: Hernandez vs. Rodrigues', difficulty: 'MEDIUM', status: 'VOID', xp: 0 },
  { missionName: 'WIN TARGET', eventLabel: 'JULY 2026 MONTHLY', difficulty: 'MONTHLY', status: 'COMPLETED', xp: 15 },
  { missionName: 'SCORE SIX', eventLabel: 'UFC 330: Makhachev vs. Machado Garry', difficulty: 'MEDIUM', status: 'COMPLETED', xp: 3 },
  { missionName: 'FIRST-ROUND FIRE', eventLabel: 'UFC 330: Makhachev vs. Machado Garry', difficulty: 'MEDIUM', status: 'FAILED', xp: 0 },
] satisfies ProfileMissionHubVM['history'];

export const PROFILE_SCENARIOS: Record<string, ProfileMissionHubVM> = {
  'profile-live': {
    userName: 'JOCHE',
    memberSince: 'JAN 2026',
    level: {
      level: 7,
      title: 'PROSPECT',
      xpIntoLevel: 9,
      xpForNextLevel: 17,
      levelProgressPct: 53,
      lifetimeXp: 69,
    },
    streak: { current: 4, best: 9, nextMilestoneLabel: '5 → +3 XP' },
    monthly: MONTHLY_ACTIVE,
    activeMissions: [ACTIVE_BANKER, ACTIVE_COMBO_PARTIAL],
    history: HISTORY_MIXED,
    pendingCelebrations: [],
  },
  'profile-levelup': {
    userName: 'JOCHE',
    memberSince: 'JAN 2026',
    level: {
      level: 10,
      title: 'RANKED',
      xpIntoLevel: 1,
      xpForNextLevel: 23,
      levelProgressPct: 4,
      lifetimeXp: 118,
    },
    streak: { current: 5, best: 9, nextMilestoneLabel: '10 → +5 XP' },
    monthly: MONTHLY_NEAR,
    activeMissions: [ACTIVE_COMBO_PARTIAL],
    history: HISTORY_MIXED,
    pendingCelebrations: [
      { kind: 'mission-completed', name: 'ONE PERFECT SHOT', xp: 4 },
      { kind: 'level-up', level: 10, title: 'RANKED', titleChanged: true },
      { kind: 'streak-milestone', count: 5, bonusXp: 3 },
    ],
  },
  'profile-broken-streak': {
    userName: 'JOCHE',
    memberSince: 'JAN 2026',
    level: {
      level: 8,
      title: 'PROSPECT',
      xpIntoLevel: 4,
      xpForNextLevel: 19,
      levelProgressPct: 21,
      lifetimeXp: 81,
    },
    streak: { current: 0, best: 9, nextMilestoneLabel: '3 → +2 XP', justBroken: true },
    monthly: MONTHLY_ACTIVE,
    activeMissions: [],
    history: HISTORY_MIXED,
    pendingCelebrations: [],
  },
  'profile-empty': {
    userName: 'NEW USER',
    memberSince: 'JUL 2026',
    level: {
      level: 1,
      title: 'BUM',
      xpIntoLevel: 0,
      xpForNextLevel: 5,
      levelProgressPct: 0,
      lifetimeXp: 0,
    },
    streak: { current: 0, best: 0, nextMilestoneLabel: '3 → +2 XP' },
    monthly: MONTHLY_ACTIVE,
    activeMissions: [],
    history: [],
    pendingCelebrations: [],
  },
  'profile-goat': {
    userName: 'JOCHE',
    memberSince: 'JAN 2026',
    level: {
      level: 50,
      title: 'GOAT',
      xpIntoLevel: 0,
      xpForNextLevel: 103,
      levelProgressPct: 100,
      lifetimeXp: 2597,
      isMaxTitle: true,
    },
    streak: { current: 23, best: 23, nextMilestoneLabel: '25 → +3 XP' },
    monthly: MONTHLY_COMPLETED,
    activeMissions: [ACTIVE_BANKER],
    history: HISTORY_MIXED,
    pendingCelebrations: [],
  },
};

// ---------------------------------------------------------------------------
// Admin scenarios
// ---------------------------------------------------------------------------

const ADMIN_EVENTS: AdminMissionsVM['events'] = [
  {
    eventId: 142997,
    eventLabel: 'UFC FN: Medić vs. Rodriguez · JUL 31',
    missionState: 'open',
    selectedCount: 7,
    canReopen: false,
    reopenBlockedReason: undefined,
  },
  {
    eventId: 143011,
    eventLabel: 'UFC FN: Gamrot vs Salkilld · AUG 7',
    missionState: 'closed',
    selectedCount: 0,
    canReopen: true,
  },
  {
    eventId: 142561,
    eventLabel: 'UFC 330: Makhachev vs. Machado Garry · AUG 15',
    missionState: 'void',
    selectedCount: 12,
    canReopen: false,
    reopenBlockedReason: 'Results already registered',
  },
];

export const ADMIN_SCENARIOS: Record<string, AdminMissionsVM> = {
  'admin-draft': {
    monthly: {
      state: 'DRAFT',
      monthLabel: 'SEPTEMBER 2026',
      templateName: 'MONTHLY SHARPSHOOTER',
      templateId: 'MONTH-V2-004',
      params: [{ key: 'accuracy_target_pct', label: 'Accuracy target %', value: 65 }],
      validationNote: 'Editable until September starts.',
    },
    events: ADMIN_EVENTS,
    reconciliationPreview: [],
    auditLog: ['[2026-08-28 14:02] DRAFT created from template MONTH-V2-004 by admin'],
  },
  'admin-active': {
    monthly: {
      state: 'ACTIVE',
      monthLabel: 'AUGUST 2026',
      templateName: 'WIN TARGET',
      templateId: 'MONTH-V2-001',
      params: [{ key: 'winner_target', label: 'Winner target', value: 15 }],
      validationNote: 'Month started. Parameters are frozen.',
    },
    events: ADMIN_EVENTS,
    reconciliationPreview: [],
    auditLog: [
      '[2026-07-31 09:00] Monthly WIN TARGET activated for AUGUST 2026',
      '[2026-07-31 10:12] Card missions closed for event 143011 by admin',
    ],
  },
  'admin-closed': {
    monthly: {
      state: 'CLOSED',
      monthLabel: 'JULY 2026',
      templateName: 'METHOD MASTER',
      templateId: 'MONTH-V2-008',
      params: [{ key: 'method_hit_target', label: 'Method hit target', value: 8 }],
      validationNote: 'Month closed. Awards already reconciled.',
    },
    events: ADMIN_EVENTS,
    reconciliationPreview: [
      { missionName: 'TWO ON THE BOARD', user: 'joche', current: 'COMPLETED / no XP row', desired: 'COMPLETED / +1 XP', action: 'award-xp' },
      { missionName: 'KO LOCK', user: 'andreysillo', current: 'ACTIVE', desired: 'VOID (bout cancelled)', action: 'mark-void' },
      { missionName: 'SCORE SIX', user: 'chris', current: 'COMPLETED / +3 XP', desired: 'COMPLETED / +3 XP', action: 'no-change' },
      { missionName: 'ELITE READS', user: 'joche', current: 'COMPLETED / +6 XP', desired: 'FAILED (result corrected)', action: 'revoke-xp' },
    ],
    auditLog: [
      '[2026-08-01 08:30] Monthly METHOD MASTER closed for JULY 2026',
      '[2026-08-01 08:31] Reconciliation preview generated (4 rows, 3 changes)',
    ],
  },
};

// ---------------------------------------------------------------------------
// Scenario registry consumed by the Lab switcher
// ---------------------------------------------------------------------------

export interface LabScenarioDef {
  id: string;
  label: string;
  surface: 'home' | 'profile' | 'admin';
  edge?: 'loading' | 'error' | 'logged-out' | 'stale' | 'missing-imagery';
}

export const LAB_SCENARIOS: LabScenarioDef[] = [
  { id: 'home-open', label: 'Home · 3 slots open + monthly active', surface: 'home' },
  { id: 'home-mixed', label: 'Home · active + open + locked', surface: 'home' },
  { id: 'home-locked', label: 'Home · all locked (3 reasons)', surface: 'home' },
  { id: 'home-settled', label: 'Home · completed / failed / VOID', surface: 'home' },
  { id: 'home-no-offers', label: 'Home · no offers + monthly not configured', surface: 'home' },
  { id: 'home-month-closed', label: 'Home · month closed', surface: 'home' },
  { id: 'profile-live', label: 'Profile · mid level, active streak', surface: 'profile' },
  { id: 'profile-levelup', label: 'Profile · queued celebrations (level up)', surface: 'profile' },
  { id: 'profile-broken-streak', label: 'Profile · broken streak', surface: 'profile' },
  { id: 'profile-empty', label: 'Profile · new user, empty history', surface: 'profile' },
  { id: 'profile-goat', label: 'Profile · GOAT ceiling', surface: 'profile' },
  { id: 'admin-draft', label: 'Admin · monthly DRAFT', surface: 'admin' },
  { id: 'admin-active', label: 'Admin · monthly ACTIVE + card ops', surface: 'admin' },
  { id: 'admin-closed', label: 'Admin · CLOSED + reconciliation preview', surface: 'admin' },
  { id: 'edge-loading', label: 'Edge · loading skeletons', surface: 'home', edge: 'loading' },
  { id: 'edge-error', label: 'Edge · gateway error + retry', surface: 'home', edge: 'error' },
  { id: 'edge-logged-out', label: 'Edge · logged out', surface: 'home', edge: 'logged-out' },
  { id: 'edge-stale', label: 'Edge · stale data notice', surface: 'home', edge: 'stale' },
  { id: 'edge-missing-imagery', label: 'Edge · missing imagery fallbacks', surface: 'home', edge: 'missing-imagery' },
];
