/**
 * Wire-level mission API contracts.
 *
 * These types describe exactly what `app/modules/missions/contracts.py` serves
 * and what `app/modules/missions/router.py` accepts — nothing else. They are
 * deliberately separate from the presentation view models in
 * `mission-mock-models.ts`: the wire shape belongs to the backend, the view
 * models belong to the UI, and `gateway/mission-api-mappers` is the single place
 * allowed to translate between them.
 *
 * This file was previously written against an invented shape, which is why Home
 * collapsed every slot to 1 and every selection returned 422. The rules that
 * keep that from recurring:
 *
 *  1. Every type here mirrors a pydantic model by name and by field. If the
 *     backend calls it `slot`, so do we — no renaming, no re-basing an index.
 *  2. `selection_spec` is a RAW DOMAIN SNAPSHOT
 *     (`definition.selection.model_dump(mode="json")`), not a UI-shaped object.
 *     Whatever a picker needs is derived from it in the mapper, never invented
 *     here. Its enum values are backend spellings (`KO_TKO`), not display copy.
 *  3. `frozenset` fields (`bound_pick_fields`, `allowed_methods`) serialize as
 *     JSON arrays in NON-DETERMINISTIC ORDER. Never index into them; the mapper
 *     sorts before use.
 *  4. The tests feed these types a payload generated from the backend's own
 *     models (`tests/fixtures/real-mission-payloads.json`), so a contract drift
 *     fails the suite instead of the browser.
 *
 * Two axes, modelled independently on purpose:
 *
 *  - `interaction` is the discriminant. It decides which picker renders and
 *    which `selection_spec` travels with the option.
 *  - `pick_effect` is NOT part of that discriminant. It describes what accepting
 *    the mission does to the user's canonical picks, and every interaction may
 *    carry any of the three effects. The compile-time proofs at the bottom of
 *    this file fail the build if the two axes are ever collapsed into one.
 *
 * Nothing here computes anything. Progress text, percentages, lock reasons,
 * VOID reasons, XP and selection summaries all arrive already resolved.
 */

import type {
  MissionDifficulty,
  MissionInteractionType,
} from './mission-mock-models';

// ---------------------------------------------------------------------------
// Scalar enums (app/modules/missions/domain/enums.py)
// ---------------------------------------------------------------------------

/** The five interaction families. Re-exported so wire code never reaches into
 *  the presentation models for the discriminant. */
export type MissionInteraction = MissionInteractionType;

/**
 * What accepting the mission does to the user's canonical picks. Independent of
 * `MissionInteraction`.
 */
export type MissionPickEffect = 'NONE' | 'UPSERT_ONE' | 'UPSERT_MANY';

export type MissionCardState = 'OPEN' | 'CLOSED' | 'VOID';

/** Status of an assignment the user already owns. Note there is no
 *  `ONE_TO_GO`: the UI has that state but the API does not report it. */
export type MissionAssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'VOID';

/**
 * The reasons `MissionReadService._lock` actually emits. Typed as a union plus
 * `string` because the backend declares `lock_reason: str | None`: an unknown
 * reason must degrade to the neutral lock language, never crash a render.
 */
export type MissionLockReason =
  | 'ADMIN_CLOSED'
  | 'RESULTS_STARTED'
  | 'PICKS_CLOSED'
  | 'CARD_NOT_FOUND'
  | (string & {});

/**
 * `MissionSelectionErrorCode` plus the router's own envelopes. Every one of
 * these arrives as `{"detail": {"code", "message"}}`.
 */
export type MissionApiErrorCode =
  | 'OFFER_NOT_FOUND'
  | 'ALREADY_SELECTED'
  | 'CARD_LOCKED'
  | 'STALE_CARD'
  | 'INVALID_SELECTION'
  | 'PICK_LOCKED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SLOT_LOCKED'
  | 'CARD_NOT_FOUND'
  | 'ASSIGNMENT_MISSING';

// ---------------------------------------------------------------------------
// selection_spec — raw domain snapshots (domain/definitions.py)
// ---------------------------------------------------------------------------

/** `PickField`. Arrives inside an unordered array. */
export type PickFieldWire = 'WINNER' | 'METHOD' | 'ROUND';

/** `WinMethod`. Backend spelling — `KO_TKO`, not `KO/TKO`. */
export type WinMethodWire = 'KO_TKO' | 'SUBMISSION' | 'DECISION';

export type WinnerBindingWire =
  | 'SELECTED_FIGHTER'
  | 'OPPONENT_OF_SELECTED_FIGHTER';

export type TargetFightOutcomeWire = 'FINISH' | 'DECISION' | 'FINISH_ROUND';

export type ComboLegTargetWire = 'FIGHTER' | 'FIGHT';

export type CardPropInputWire = 'ACCEPT' | 'CHOICE' | 'EXACT_COUNT';

export type CardPropTargetSourceWire =
  | 'STATIC'
  | 'FROZEN_ELIGIBLE_RATIO'
  | 'SELECTED_EXACT_COUNT';

/** `TargetFighterSelectionSpec`. */
export interface TargetFighterSelectionSpecWire {
  /** UNORDERED. Presence of `METHOD`/`ROUND` is what makes them required. */
  bound_pick_fields: PickFieldWire[];
  winner_binding: WinnerBindingWire;
  /** UNORDERED. Empty means the mission binds no method at all. */
  allowed_methods: WinMethodWire[];
  /** Empty means no exact round is bound. */
  allowed_rounds: number[];
  title_bouts_only: boolean;
}

/** `TargetFightSelectionSpec`. Present and non-null — the old DTO said `null`. */
export interface TargetFightSelectionSpecWire {
  outcome: TargetFightOutcomeWire;
  required_round: number | null;
}

/** `ComboLegSpec`. `key` is REQUIRED by the select command for every leg. */
export interface ComboLegSpecWire {
  key: string;
  label: string;
  target: ComboLegTargetWire;
  /** A fixed method the user does NOT choose. Sending one back is rejected. */
  method: WinMethodWire | null;
  /** UNORDERED. Non-empty means the user MUST choose one of these. */
  allowed_methods: WinMethodWire[];
  round: number | null;
  fight_outcome: TargetFightOutcomeWire | null;
}

/** `ComboSelectionSpec`. */
export interface ComboSelectionSpecWire {
  leg_count: 2 | 3;
  legs: ComboLegSpecWire[];
  distinct_bouts: boolean;
  distinct_methods: boolean;
  title_bouts_only: boolean;
}

/** `CardPropSelectionSpec`. */
export interface CardPropSelectionSpecWire {
  input: CardPropInputWire;
  choices: string[];
  max_count: number | null;
  target_source: CardPropTargetSourceWire;
  frozen_ratio: number | null;
  /**
   * The line a ratio-based prop is asking the user to beat, already resolved
   * against the card. Absent for props whose target is static — their
   * description states the number outright.
   */
  displayed_target?: number | null;
  /** What an exact-count stepper is counting, e.g. `FINISHES`. */
  count_unit?: string | null;
}

// ---------------------------------------------------------------------------
// MissionOfferView — one selectable option inside a slot
// ---------------------------------------------------------------------------

interface MissionOfferCommon {
  /** The id `POST /missions/select` addresses. `offer_<hex>`, NOT the mission
   *  id: one mission can be offered under several offer ids. */
  offer_id: string;
  mission_id: string;
  name: string;
  description: string;
  difficulty: MissionDifficulty;
  xp: number;
  /** Second, independent axis. Present on every interaction. */
  pick_effect: MissionPickEffect;
  selection_prompt?: string | null;
}

export interface AutoMissionOfferDTO extends MissionOfferCommon {
  interaction: 'AUTO';
  /** AUTO definitions declare `selection: None`. */
  selection_spec?: null;
}

export interface TargetFighterMissionOfferDTO extends MissionOfferCommon {
  interaction: 'TARGET_FIGHTER';
  selection_spec: TargetFighterSelectionSpecWire;
}

export interface TargetFightMissionOfferDTO extends MissionOfferCommon {
  interaction: 'TARGET_FIGHT';
  selection_spec: TargetFightSelectionSpecWire;
}

export interface ComboBuilderMissionOfferDTO extends MissionOfferCommon {
  interaction: 'COMBO_BUILDER';
  selection_spec: ComboSelectionSpecWire;
}

export interface CardPropMissionOfferDTO extends MissionOfferCommon {
  interaction: 'CARD_PROP';
  selection_spec: CardPropSelectionSpecWire;
}

export type MissionOfferDTO =
  | AutoMissionOfferDTO
  | TargetFighterMissionOfferDTO
  | TargetFightMissionOfferDTO
  | ComboBuilderMissionOfferDTO
  | CardPropMissionOfferDTO;

// ---------------------------------------------------------------------------
// SelectedMissionView — an assignment the user already owns
// ---------------------------------------------------------------------------

export interface SelectedMissionDTO {
  assignment_id: string;
  event_id: number;
  /** The card's display name, resolved by the backend. */
  event_label?: string | null;
  /** 1..3, same numbering the UI uses. */
  slot: number;
  offer_id?: string | null;
  mission_id: string;
  name: string;
  description: string;
  difficulty: MissionDifficulty;
  xp: number;
  /** Awarded XP: 0 until the mission actually completes. */
  xp_earned?: number;
  interaction: MissionInteraction;
  status: MissionAssignmentStatus;
  /** Already rendered by the backend. The UI never builds this sentence. */
  progress_text: string;
  /** Already resolved 0..100. The UI never divides anything. */
  progress_percent: number;
  selection_summary?: string | null;
  /**
   * The same choice already split into styleable pieces, so a combo renders one
   * part per leg instead of a single run-on line. The backend also spells the
   * method for display here (`KO/TKO`, not the `KO_TKO` enum).
   */
  selection_parts?: SelectionPartDTO[] | null;
  /**
   * The resolved selection the backend persisted. Free-form on purpose: it is
   * a domain document, not a view model. The mapper reads only the identifiers
   * it needs to resolve a fighter portrait and never re-derives progress.
   */
  selection?: ResolvedSelectionDTO | null;
  void_reason?: string | null;
}

/** One styleable piece of a selection: `MANOEL SOUSA` + `KO/TKO`. */
export interface SelectionPartDTO {
  label?: string | null;
  value: string;
  detail?: string | null;
}

/** The parts of a persisted selection the mapper is allowed to look at. */
export interface ResolvedSelectionDTO {
  kind?: MissionInteraction;
  bout_id?: number;
  bout_ids?: number[];
  corner?: 'red' | 'blue';
  legs?: Array<{
    key?: string;
    bout_id?: number;
    corner?: 'red' | 'blue';
    fighter_name?: string;
    method?: WinMethodWire | null;
    round?: number | null;
  }>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// GET /missions/home
// ---------------------------------------------------------------------------

export interface MissionSlotDTO {
  /** ONE-BASED, 1..3. There is no zero-based index anywhere on this wire. */
  slot: number;
  selected: SelectedMissionDTO | null;
  options: MissionOfferDTO[];
}

export interface MonthlyMissionDTO {
  /** e.g. "2026-08". A key, not display copy — the UI formats the label. */
  month_key: string;
  mission_id: string;
  name: string;
  description: string;
  xp: number;
  status: MissionAssignmentStatus;
  progress_text: string;
  progress_percent: number;
}

export interface MissionHomeResponseDTO {
  event_id: number;
  card_state: MissionCardState;
  offer_set_id?: string | null;
  card_revision?: number | null;
  monthly?: MonthlyMissionDTO | null;
  slots: MissionSlotDTO[];
  locked: boolean;
  lock_reason?: MissionLockReason | null;
}

// ---------------------------------------------------------------------------
// POST /missions/select
// ---------------------------------------------------------------------------

/**
 * Selection payload, mirroring `domain/selections.py`. Those models are
 * `extra="forbid"`, so an unknown key is a 422 — this is the complete and exact
 * set of fields each family may send.
 *
 * `kind` is included for symmetry but the router overwrites it from the offer's
 * own interaction: the discriminator is server truth, never client input.
 */
export type MissionSelectionPayloadDTO =
  | { kind: 'AUTO' }
  | {
      kind: 'TARGET_FIGHTER';
      bout_id: number;
      corner: 'red' | 'blue';
      /** Only when the definition binds METHOD. Sending one otherwise is a 409. */
      method?: WinMethodWire;
      /** Only when the definition binds ROUND. */
      round?: number;
    }
  | { kind: 'TARGET_FIGHT'; bout_id: number }
  | {
      kind: 'COMBO_BUILDER';
      /** `key` must match a `ComboLegSpecWire.key`. A FIGHT leg sends neither
       *  `corner` nor `method`; a fixed-method leg sends no `method`. */
      legs: Array<{
        key: string;
        bout_id: number;
        corner?: 'red' | 'blue';
        method?: WinMethodWire;
      }>;
    }
  | { kind: 'CARD_PROP'; choice?: string; exact_count?: number };

export interface MissionSelectRequestDTO {
  event_id: number;
  /** ONE-BASED. `Literal[1, 2, 3]` on the backend. */
  slot: 1 | 2 | 3;
  /** The OFFER id, not the mission id. */
  offer_id: string;
  /** 8..128 chars matching `^[A-Za-z0-9._:-]+$`. Replaying it is a no-op. */
  idempotency_key: string;
  selection: MissionSelectionPayloadDTO | null;
  /**
   * Fields the mission binds but does not fix, for bouts the user has not
   * picked. Without these the server refuses six of the catalog's missions
   * with `A complete canonical pick method is required`, because a canonical
   * pick has to be complete and there is no existing pick to inherit from.
   *
   * Never restate a value the mission itself fixed: the server treats a patch
   * that disagrees with a binding as a conflict.
   */
  pick_patches?: Array<{
    bout_id: number;
    method?: WinMethodWire;
    round?: number;
  }>;
}

/** 201 returns the same assignment shape Home already renders. */
export type MissionSelectResponseDTO = SelectedMissionDTO;

// ---------------------------------------------------------------------------
// Errors — FastAPI wraps EVERYTHING in `detail`
// ---------------------------------------------------------------------------

/** The body of a mission `HTTPException`: `{"detail": {"code", "message"}}`. */
export interface MissionErrorBodyDTO {
  detail?:
    | { code?: string; message?: string }
    | string
    | Array<{ loc?: unknown[]; msg?: string; type?: string }>;
}

// ---------------------------------------------------------------------------
// GET /missions/profile
// ---------------------------------------------------------------------------

export interface MissionCelebrationDTO {
  id: string;
  kind: string;
  presentation: string;
  heading: string;
  message: string;
  /**
   * Typed payload behind the display copy: level/title for a level-up, streak
   * and bonus for a milestone, name and XP for a completed mission. Free-form
   * on the wire; the mapper reads only the keys each kind guarantees.
   */
  metadata?: Record<string, unknown>;
}

/** One settled card and what it did to the streak. */
export interface StreakCardDTO {
  event_id: number;
  event_label?: string | null;
  outcome: 'ADVANCED' | 'BROKEN' | 'UNCHANGED';
  picked: number;
  denominator: number;
  /** Already resolved 0..100. */
  coverage_percent: number;
  streak_after: number;
  milestone?: number | null;
  xp_earned?: number;
}

export interface MissionProfileResponseDTO {
  lifetime_xp: number;
  level: number;
  title: string;
  xp_into_level: number;
  xp_for_next_level: number;
  level_progress_pct: number;
  next_title?: string | null;
  next_title_level?: number | null;
  current_streak: number;
  best_streak: number;
  /** Finished copy, e.g. "5 -> +3 XP". The UI never re-derives the curve. */
  next_streak_milestone_label?: string;
  /** True when the last settled card broke the streak. */
  streak_just_broke?: boolean;
  monthly?: MonthlyMissionDTO | null;
  active: SelectedMissionDTO[];
  history: SelectedMissionDTO[];
  streak_history?: StreakCardDTO[];
  celebrations: MissionCelebrationDTO[];
}

// ---------------------------------------------------------------------------
// GET /missions/capabilities
// ---------------------------------------------------------------------------

export interface MissionCapabilitiesDTO {
  api_version: string;
  catalog_version: string;
  interaction_types: MissionInteraction[];
}

// ---------------------------------------------------------------------------
// Exhaustiveness
// ---------------------------------------------------------------------------

/**
 * Compile-time exhaustiveness guard for the five interaction families.
 *
 * Call it from the `default` branch of any switch over `interaction`. If a new
 * family is added to `MissionInteraction` and a switch forgets to handle it,
 * the residual type stops being `never` and the build fails.
 */
export function assertNeverInteraction(value: never): never {
  throw new Error(
    `Unhandled mission interaction: ${JSON.stringify(value as unknown)}`
  );
}

// ---------------------------------------------------------------------------
// Compile-time proofs (erased at runtime, enforced by `npm run type-check`)
// ---------------------------------------------------------------------------

type Expect<T extends true> = T;

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/** The option union covers every interaction, and no extra ones. */
export type ProofOptionsCoverEveryInteraction = Expect<
  Equals<MissionOfferDTO['interaction'], MissionInteraction>
>;

/**
 * `pick_effect` is a free axis: fixing the interaction must not narrow the set
 * of pick effects. Five proofs, one per family — if anyone folds the effect
 * into the discriminant these stop resolving to `true`.
 */
export type ProofPickEffectFreeForAuto = Expect<
  Equals<AutoMissionOfferDTO['pick_effect'], MissionPickEffect>
>;
export type ProofPickEffectFreeForTargetFighter = Expect<
  Equals<TargetFighterMissionOfferDTO['pick_effect'], MissionPickEffect>
>;
export type ProofPickEffectFreeForTargetFight = Expect<
  Equals<TargetFightMissionOfferDTO['pick_effect'], MissionPickEffect>
>;
export type ProofPickEffectFreeForComboBuilder = Expect<
  Equals<ComboBuilderMissionOfferDTO['pick_effect'], MissionPickEffect>
>;
export type ProofPickEffectFreeForCardProp = Expect<
  Equals<CardPropMissionOfferDTO['pick_effect'], MissionPickEffect>
>;

/**
 * The same statement quantified over every family at once: narrowing by
 * `interaction` must leave the full set of pick effects available, so the two
 * axes stay orthogonal rather than one implying the other.
 */
export type ProofEveryInteractionAdmitsEveryPickEffect = Expect<
  Equals<
    {
      [I in MissionInteraction]: Extract<
        MissionOfferDTO,
        { interaction: I }
      >['pick_effect'];
    }[MissionInteraction],
    MissionPickEffect
  >
>;

/**
 * The select request is one-based and offer-addressed. These two proofs are the
 * shape of the original bug: `slot_index`/`mission_id` cannot come back without
 * failing the type-check.
 */
export type ProofSlotIsOneBased = Expect<
  Equals<MissionSelectRequestDTO['slot'], 1 | 2 | 3>
>;
export type ProofSelectAddressesAnOffer = Expect<
  Equals<MissionSelectRequestDTO['offer_id'], string>
>;

// ---------------------------------------------------------------------------
// Admin: card control and reconciliation
// ---------------------------------------------------------------------------

/** One tunable parameter of a monthly template, with the bounds Admin may use. */
export interface MonthlyParameterDTO {
  key: string;
  /** Human label written in the reviewed workbook, e.g. "Winners required". */
  label: string;
  kind: string;
  default: number;
  minimum?: number | null;
  maximum?: number | null;
}

/** `GET /admin/missions/monthly/templates` — the 18 reviewed templates. */
export interface MonthlyTemplateDTO {
  mission_id: string;
  name: string;
  description: string;
  xp: number;
  compatibility: string;
  parameters: MonthlyParameterDTO[];
}

/** `GET/PUT /admin/missions/monthly/{month_key}` and its activate/close posts. */
export interface MonthlyConfigDTO {
  month_key: string;
  mission_id: string;
  name: string;
  description: string;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  xp: number;
  /** Catalog parameters, e.g. `{ winner_target: 15 }`. Values are numbers. */
  parameters: Record<string, number>;
  starts_at?: string | null;
  ends_at?: string | null;
  activated_at?: string | null;
  closed_at?: string | null;
  /** False once the month started or progress exists. Drives the form's lock. */
  editable: boolean;
}

export interface CardControlDTO {
  event_id: number;
  state: 'OPEN' | 'CLOSED' | 'VOID';
  reason?: string | null;
  actor_id?: string | null;
  updated_at?: string | null;
  voided_assignments?: number;
  /** Missions users hold on this card. What VOID would settle. */
  selected_assignments?: number;
  revision?: number;
}

export interface ReconciliationOperationDTO {
  operation_id: string;
  action: 'INSERT' | 'UPDATE';
  entity_type: string;
  entity_id: string;
  impact: string;
  changed_fields: string[];
  before?: Record<string, unknown> | null;
  after: Record<string, unknown>;
}

export interface ReconciliationPreviewDTO {
  preview_version: string;
  plan_id: string;
  current_digest: string;
  desired_digest: string;
  converged: boolean;
  safe_to_apply: boolean;
  operations: ReconciliationOperationDTO[];
  unchanged_entities: string[];
  blockers: Array<{ code: string; message: string; blocking: boolean }>;
}

export interface ReconciliationApplyDTO {
  plan_id: string;
  applied: number;
  skipped: number;
  converged: boolean;
}
