/**
 * FE-000A Mission Lab — presentation-only mock models.
 *
 * These types exist so the local /mission-lab prototype can render every
 * mission surface deterministically. They are NOT Contract V1: field names,
 * shapes and enums may all change when the real contract is designed after
 * backend review. Nothing here may be imported by production surfaces.
 *
 * Domain rules (XP, eligibility, completion, streak advancement, reward
 * idempotency) remain backend authority; every "resolved" number in these
 * models arrives pre-computed from fixtures, never derived in React.
 */

import type { Fighter } from '@/lib/api';

// ---------------------------------------------------------------------------
// Card context (real fighters/imagery flow through the existing pipeline)
// ---------------------------------------------------------------------------

export interface LabBout {
  id: number;
  weightClass: string;
  section: 'main' | 'prelim';
  isMainEvent?: boolean;
  isCoMain?: boolean;
  /** Card data: how many rounds this bout is booked for (3 or 5). */
  roundsScheduled: 3 | 5;
  red: Fighter;
  blue: Fighter;
}

export interface LabEventContext {
  eventId: number;
  eventName: string;
  /** Existing hero/poster URL or null to exercise the art fallback. */
  eventImageUrl: string | null;
  bouts: LabBout[];
}

// ---------------------------------------------------------------------------
// Offers (discriminated by the five interaction families)
// ---------------------------------------------------------------------------

export type MissionInteractionType =
  | 'AUTO'
  | 'TARGET_FIGHTER'
  | 'TARGET_FIGHT'
  | 'COMBO_BUILDER'
  | 'CARD_PROP';

export type MissionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface MissionOfferBase {
  offerId: string;
  /** Catalog id, e.g. CARD-V2-E-001. */
  missionId: string;
  name: string;
  description: string;
  difficulty: MissionDifficulty;
  xp: number;
  /** Catalog "Progreso mostrado" template shown verbatim once active. */
  progressTemplate: string;
  /** Catalog "Selección requerida" prompt, when the family needs one. */
  selectionPrompt?: string;
  /**
   * What accepting this mission does to the user's canonical picks. A SEPARATE
   * axis from `interaction`: any family may carry any effect, so it lives on
   * the base and is never part of the discriminant. Optional here because the
   * Lab fixtures predate it; the HTTP adapter always populates it.
   */
  pickEffect?: 'NONE' | 'UPSERT_ONE' | 'UPSERT_MANY';
}

export interface AutoMissionOffer extends MissionOfferBase {
  interaction: 'AUTO';
}

export type WinMethod = 'KO/TKO' | 'Submission' | 'Decision';

export interface TargetFighterMissionOffer extends MissionOfferBase {
  interaction: 'TARGET_FIGHTER';
  /** EXACT SCRIPT style missions also ask for method and/or round. Derived in
   *  the gateway from `bound_pick_fields`, never guessed in React. */
  requiresMethod?: boolean;
  requiresRound?: boolean;
  /**
   * Methods this definition accepts. A mission that needs an exact finishing
   * round must not offer Decision, because a decision has no such round.
   * Defaults to all three when the definition does not restrict them.
   */
  allowedMethods?: WinMethod[];
  /** Rounds the definition allows, intersected with the bout schedule by the
   *  picker. Empty/absent means every scheduled round is acceptable. */
  allowedRounds?: Array<1 | 2 | 3 | 4 | 5>;
  /**
   * Whether the canonical winner is the fighter the user picked or that
   * fighter's opponent. Display-only: the payload always names the fighter the
   * user touched and the backend derives the winner.
   */
  winnerBinding?: 'SELECTED_FIGHTER' | 'OPPONENT_OF_SELECTED_FIGHTER';
  /** The definition restricts the roster to title bouts. */
  titleBoutsOnly?: boolean;
}

export interface TargetFightMissionOffer extends MissionOfferBase {
  interaction: 'TARGET_FIGHT';
  /** What has to happen in the chosen fight. Display-only; the user picks the
   *  bout and nothing else. */
  outcome?: 'FINISH' | 'DECISION' | 'FINISH_ROUND';
  requiredRound?: number;
}

/**
 * One leg of a combo, as the definition describes it.
 *
 * `key` is load-bearing: the select command addresses legs by key, so a leg
 * without one cannot be submitted. `method` and `allowedMethods` are mutually
 * exclusive by construction — a fixed method is chosen by the catalog, an
 * `allowedMethods` list is chosen by the user.
 */
export interface ComboLegOffer {
  key: string;
  label: string;
  target: 'FIGHTER' | 'FIGHT';
  /** Fixed by the definition. Echoing it back in the payload is rejected. */
  method?: WinMethod;
  /** Non-empty means this leg REQUIRES the user to choose one of these. */
  allowedMethods?: WinMethod[];
  round?: number;
  fightOutcome?: 'FINISH' | 'DECISION' | 'FINISH_ROUND';
}

export interface ComboBuilderMissionOffer extends MissionOfferBase {
  interaction: 'COMBO_BUILDER';
  legCount: 2 | 3;
  /** Human rule shown in the builder, e.g. "One KO/TKO, one SUB, one DEC". */
  legRule: string;
  /** Per-leg label when legs are asymmetric (Round Ladder: R1/R2/R3). */
  legLabels?: string[];
  /** The definition's legs. Absent only for legacy Lab fixtures. */
  legs?: ComboLegOffer[];
  /** Every leg of a combo targets the same thing: fighters or whole fights. */
  legTarget?: 'FIGHTER' | 'FIGHT';
  /** Each leg must use a different method. Only ever set on selectable-method
   *  fighter combos. */
  distinctMethods?: boolean;
  distinctBouts?: boolean;
  titleBoutsOnly?: boolean;
}

export interface CardPropMissionOffer extends MissionOfferBase {
  interaction: 'CARD_PROP';
  propKind: 'accept' | 'choice' | 'exact-count';
  /** For propKind 'choice' (PICK A LANE). The catalog guarantees at least two. */
  choices?: string[];
  /**
   * For "Displayed Line" props the frozen target comes from the offer data
   * (mock stand-in for a backend-computed value).
   */
  displayedTarget?: number;
  /** For 'exact-count': stepper range 0..maxCount (mock offer data). */
  maxCount?: number;
  /** Noun shown beside the stepper count, e.g. "FINISHES" in "4 / 7 FINISHES". */
  countUnit?: string;
}

export type MissionOffer =
  | AutoMissionOffer
  | TargetFighterMissionOffer
  | TargetFightMissionOffer
  | ComboBuilderMissionOffer
  | CardPropMissionOffer;

// ---------------------------------------------------------------------------
// Selection payloads (what the drawer would submit — mock only)
// ---------------------------------------------------------------------------

export type MockSelection =
  | { kind: 'AUTO' }
  | {
      kind: 'TARGET_FIGHTER';
      boutId: number;
      corner: 'red' | 'blue';
      method?: WinMethod;
      round?: 1 | 2 | 3 | 4 | 5;
    }
  | { kind: 'TARGET_FIGHT'; boutId: number }
  | {
      kind: 'COMBO_BUILDER';
      /**
       * `key` addresses the leg in the definition — the select command requires
       * it. `corner` and `method` are present only for the leg shapes that
       * accept them: a FIGHT leg carries neither, and a fixed-method leg
       * carries no method.
       */
      legs: Array<{
        key?: string;
        boutId: number;
        corner?: 'red' | 'blue';
        method?: WinMethod;
        legLabel?: string;
      }>;
    }
  | { kind: 'CARD_PROP'; choice?: string; exactCount?: number };

// ---------------------------------------------------------------------------
// Active/settled mission view model
// ---------------------------------------------------------------------------

export type ActiveMissionStatus =
  | 'ACTIVE'
  | 'ONE_TO_GO'
  | 'COMPLETED'
  | 'FAILED'
  | 'VOID';

/**
 * One piece of what the user chose: a muted role and the value they picked.
 * A combo carries one part per leg, so every leg renders with the same
 * treatment instead of the surface splitting a sentence on punctuation.
 */
export interface SelectionPartVM {
  /** Role or leg label, e.g. "Banker", "KO", "Your lane". */
  label?: string;
  value: string;
  /**
   * Qualifier that rides along with the value and reads quieter than it, e.g.
   * the `KO/TKO` in "MANOEL SOUSA KO/TKO". Kept separate from `value` so the
   * surface can de-emphasise it instead of shouting the whole leg.
   */
  detail?: string;
}

/**
 * Countable progress, split into parts so the meter can style them
 * independently (the achieved number carries the status colour, the target
 * stays neutral). React never parses `progressText` to obtain these: a mission
 * whose progress is not a fraction simply omits this and keeps the sentence.
 */
export interface MissionProgressVM {
  /** Already achieved. */
  current: number;
  /** Target the mission is measured against. */
  total: number;
  /** Unit noun, e.g. "WINNERS", "LEGS", "XP". */
  unit: string;
}

/**
 * Progress that is a comparison instead of a fraction, e.g. PICK A LANE, where
 * your side has to beat the other one. Arrives as parts so the numbers can be
 * coloured and the nouns stay quiet.
 */
export interface MissionCompareVM {
  label: string;
  value: number;
}

export interface ActiveMissionVM {
  missionId: string;
  name: string;
  /**
   * The catalog line explaining what the mission asks for. Shown on demand:
   * once a mission is active its name alone ("THREE STRIKES") does not remind
   * anyone what they signed up for.
   */
  description?: string;
  interaction: MissionInteractionType;
  difficulty: MissionDifficulty;
  xp: number;
  /** Flat fallback, e.g. "Banker: Uroš Medić". Used for labels and when the
   *  selection has no parts. */
  selectionSummary?: string;
  /** The same choice as parts, so each role/value pair is styled on its own. */
  selection?: SelectionPartVM[];
  /**
   * Bout/corner the selection points at. Fixture-level data: the gateway uses
   * it to resolve `targetFighter`; surfaces never look it up themselves.
   */
  targetBoutId?: number;
  targetCorner?: 'red' | 'blue';
  /** Resolved by the gateway so surfaces can render a face without fixtures. */
  targetFighter?: Fighter | null;
  /** Pre-resolved catalog progress text, e.g. "1 / 3 finishes". */
  progressText: string;
  /** Same progress as parts, when the mission counts something. */
  progress?: MissionProgressVM;
  /** Progress expressed as a comparison between two or more tallies. */
  progressCompare?: MissionCompareVM[];
  /** Pre-resolved 0..100 (fixture data, not derived). */
  progressPct: number;
  status: ActiveMissionStatus;
  voidReason?: string;
  earnedXp?: number;
}

// ---------------------------------------------------------------------------
// Home surface
// ---------------------------------------------------------------------------

export type SlotLockReason = 'picks-closed' | 'admin-closed' | 'results-started';

export type MissionSlotVM =
  | { slot: 1 | 2 | 3; state: 'no-offers' }
  | { slot: 1 | 2 | 3; state: 'open'; offers: MissionOffer[] }
  | { slot: 1 | 2 | 3; state: 'locked'; reason: SlotLockReason }
  | { slot: 1 | 2 | 3; state: 'active'; mission: ActiveMissionVM }
  | { slot: 1 | 2 | 3; state: 'settled'; mission: ActiveMissionVM };

export type MonthlyVM =
  | { state: 'not-configured'; monthLabel: string }
  | { state: 'month-closed'; monthLabel: string; name: string; finalText: string }
  | {
      state: 'active' | 'near-completion' | 'completed';
      monthLabel: string;
      name: string;
      description: string;
      progressText: string;
      progress?: MissionProgressVM;
      progressPct: number;
      xp: number;
    };

export interface HomeMissionsVM {
  event: LabEventContext;
  /** e.g. "MISSIONS LOCK WITH PRELIM PICKS — 01D 04H". Display-only. */
  lockLabel: string;
  monthly: MonthlyVM;
  slots: MissionSlotVM[];
}

// ---------------------------------------------------------------------------
// Profile Mission Hub
// ---------------------------------------------------------------------------

export interface StreakVM {
  current: number;
  best: number;
  /** Next milestone display, e.g. "5 → +3 XP". */
  nextMilestoneLabel: string;
  justBroken?: boolean;
}

export interface LevelVM {
  level: number;
  title: string;
  /** Pre-resolved numbers from the confirmed curve. */
  xpIntoLevel: number;
  xpForNextLevel: number;
  /** Pre-resolved 0..100 fill, like every other meter in the feature. */
  levelProgressPct: number;
  lifetimeXp: number;
  isMaxTitle?: boolean;
}

export interface HistoryRowVM {
  missionName: string;
  eventLabel: string;
  difficulty: MissionDifficulty | 'MONTHLY';
  status: 'COMPLETED' | 'FAILED' | 'VOID';
  xp: number;
}

/**
 * `id` is the stable identity an acknowledgement is addressed to, so ack is
 * exactly-once rather than positional. Optional because the Lab fixtures are
 * positional; the gateway adapters always populate it.
 */
export type CelebrationVM =
  | { id?: string; kind: 'mission-completed'; name: string; xp: number }
  | { id?: string; kind: 'level-up'; level: number; title: string; titleChanged: boolean }
  | { id?: string; kind: 'streak-milestone'; count: number; bonusXp: number };

export interface ProfileMissionHubVM {
  userName: string;
  memberSince: string;
  level: LevelVM;
  streak: StreakVM;
  monthly: MonthlyVM;
  activeMissions: ActiveMissionVM[];
  history: HistoryRowVM[];
  pendingCelebrations: CelebrationVM[];
}

// ---------------------------------------------------------------------------
// Admin surface
// ---------------------------------------------------------------------------

export type MonthlyConfigState = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface AdminMonthlyVM {
  state: MonthlyConfigState;
  monthLabel: string;
  templateName: string;
  templateId: string;
  /** Editable parameters with catalog defaults, e.g. winner_target=15. The
   *  bounds are the reviewed ones; the input enforces nothing the API does not. */
  params: Array<{
    key: string;
    label: string;
    value: number;
    min?: number;
    max?: number;
  }>;
  /** Every template Admin may pick for a month that is still editable. */
  templates?: Array<{ id: string; name: string }>;
  validationNote?: string;
}

export interface AdminEventMissionRowVM {
  eventId: number;
  eventLabel: string;
  missionState: 'open' | 'closed' | 'void';
  selectedCount: number;
  canReopen: boolean;
  /** Why reopen is blocked, when it is (results registered, lifecycle). */
  reopenBlockedReason?: string;
}

export interface ReconciliationRowVM {
  missionName: string;
  user: string;
  current: string;
  desired: string;
  action: 'award-xp' | 'revoke-xp' | 'mark-void' | 'no-change';
}

export interface AdminMissionsVM {
  monthly: AdminMonthlyVM;
  events: AdminEventMissionRowVM[];
  reconciliationPreview: ReconciliationRowVM[];
  auditLog: string[];
}

// ---------------------------------------------------------------------------
// Lab plumbing
// ---------------------------------------------------------------------------

export type LabSurface = 'home' | 'profile' | 'admin';

export type LabEdgeState =
  | 'none'
  | 'loading'
  | 'error'
  | 'logged-out'
  | 'stale';

// ---------------------------------------------------------------------------
// Admin control surface
// ---------------------------------------------------------------------------

export interface CardControlVM {
  eventId: number;
  state: 'OPEN' | 'CLOSED' | 'VOID';
  /** Why the last action was taken. Rendered in the audit trail. */
  reason: string | null;
  actorId: string | null;
  updatedAt: string | null;
  /** How many ACTIVE assignments a VOID settled. */
  voidedAssignments: number;
  /** Missions users hold on this card — what a VOID would settle. */
  selectedAssignments: number;
  revision: number;
}

export interface ReconciliationOperationVM {
  operationId: string;
  action: 'INSERT' | 'UPDATE';
  entityType: string;
  entityId: string;
  impact: string;
  changedFields: string[];
  /** Rendered as-is. The surface never diffs these itself. */
  beforeText: string;
  afterText: string;
}

export interface ReconciliationPreviewVM {
  planId: string;
  converged: boolean;
  safeToApply: boolean;
  operations: ReconciliationOperationVM[];
  unchangedCount: number;
  blockers: Array<{ code: string; message: string; blocking: boolean }>;
}

export interface ReconciliationResultVM {
  planId: string;
  applied: number;
  skipped: number;
  converged: boolean;
}
