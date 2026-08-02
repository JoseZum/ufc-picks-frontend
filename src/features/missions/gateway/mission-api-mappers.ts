/**
 * The only place allowed to translate mission wire payloads into the
 * presentation view models the surfaces render.
 *
 * Everything here is either a rename, an enum-to-copy lookup, or an object
 * assembly. There is deliberately no arithmetic, no threshold, no comparison
 * against a target and no string parsing of a backend sentence:
 *
 *  - `progress_text`  -> `progressText`   (verbatim)
 *  - `progress_percent` -> `progressPct`  (verbatim)
 *  - `selection_summary` -> `selectionSummary` (verbatim, never split)
 *  - `void_reason`    -> `voidReason`     (verbatim)
 *  - `xp` / `xp_earned` -> `xp` / `earnedXp` (verbatim)
 *
 * `selection_spec` is the one place that needs real work. The backend sends a
 * RAW DOMAIN SNAPSHOT of the mission definition, not a UI-shaped object, so the
 * picker inputs are DERIVED here — `requiresMethod` from the presence of
 * `METHOD` in `bound_pick_fields`, method spellings from the backend enum, leg
 * keys straight off the definition. Deriving is not computing: nothing below
 * decides whether a mission is complete, eligible or rewarded.
 *
 * Two properties of the wire that bit us before and are handled explicitly:
 *
 *  - `bound_pick_fields` and `allowed_methods` are pydantic `frozenset`s. Their
 *    JSON array order is NON-DETERMINISTIC between processes. Everything read
 *    off them is membership-tested or sorted into a canonical order, so the
 *    same payload always renders the same way.
 *  - Slots are ONE-BASED on the wire (`slot: 1|2|3`). No re-basing happens here.
 *
 * GAPS against the current contract (report, do not paper over):
 *  1. `ONE_TO_GO` — the UI has a "1 to go" state; the API only reports
 *     ACTIVE/COMPLETED/FAILED/VOID, so it can never be produced over HTTP.
 *  2. `near-completion` monthly — same reason.
 *  3. Split progress (`current`/`total`/`unit`) and comparison progress are not
 *     on the wire, so the meter renders the sentence form only. Parsing
 *     `progress_text` would be domain logic in React and is not done.
 *  4. Split selection parts are not on the wire. A combo therefore renders as
 *     one summary line instead of one styled part per leg.
 *  5. CARD_PROP `displayed_target` does not exist. The definition carries
 *     `target_source` and `frozen_ratio` (raw domain inputs); resolving a
 *     displayed line from them would be exactly the recomputation this
 *     boundary exists to prevent, so no target is shown over HTTP.
 *  6. `count_unit` for the exact-count stepper is not on the wire; the picker
 *     falls back to its neutral noun.
 *
 * (7) is closed: celebrations now carry a typed `metadata` payload beside the
 * display copy, so the `CelebrationVM` union is built from it.
 */

import type { Bout, Event } from '@/lib/api';
import { getEventArtUrl, normalizeWeightClassLabel } from '@/lib/api';
import type {
  ActiveMissionStatus,
  ActiveMissionVM,
  CardControlVM,
  CelebrationVM,
  ComboLegOffer,
  HistoryRowVM,
  HomeMissionsVM,
  LabBout,
  LabEventContext,
  MissionOffer,
  MissionSlotVM,
  MockSelection,
  MonthlyVM,
  ProfileMissionHubVM,
  ReconciliationPreviewVM,
  SlotLockReason,
  WinMethod,
} from '../contracts/mission-mock-models';
import type {
  CardControlDTO,
  ComboSelectionSpecWire,
  MissionCelebrationDTO,
  MissionHomeResponseDTO,
  MissionOfferDTO,
  MissionProfileResponseDTO,
  MissionSelectionPayloadDTO,
  MissionSlotDTO,
  MonthlyMissionDTO,
  ReconciliationPreviewDTO,
  ResolvedSelectionDTO,
  SelectedMissionDTO,
  WinMethodWire,
} from '../contracts/mission-api-contracts';
import { assertNeverInteraction } from '../contracts/mission-api-contracts';

// ---------------------------------------------------------------------------
// Card context (from the product's existing event/bout endpoints)
// ---------------------------------------------------------------------------

/** Field rename only. `rounds_scheduled` is card data, not a judgement. */
export function toLabBout(bout: Bout, index: number): LabBout {
  return {
    id: bout.id,
    weightClass: normalizeWeightClassLabel(bout.weight_class),
    section: bout.card_section === 'main' ? 'main' : 'prelim',
    isMainEvent: bout.is_main_event === true || index === 0,
    isCoMain: index === 1,
    roundsScheduled: bout.rounds_scheduled === 5 ? 5 : 3,
    red: bout.fighters.red,
    blue: bout.fighters.blue,
  };
}

export function toLabBouts(bouts: Bout[] | undefined): LabBout[] {
  return (bouts ?? []).map(toLabBout);
}

/**
 * Assemble the card context the drawer's pickers need. Uses the product's own
 * event art pipeline; a null image is a supported design state, not a failure.
 */
export function toCardContext(
  eventId: number,
  event: Event | undefined,
  bouts: Bout[] | undefined
): LabEventContext {
  return {
    eventId,
    eventName: event?.name ?? 'THIS CARD',
    eventImageUrl: event ? getEventArtUrl(event) : null,
    bouts: toLabBouts(bouts),
  };
}

// ---------------------------------------------------------------------------
// Win methods: backend spelling <-> display spelling
// ---------------------------------------------------------------------------

/**
 * The backend enum is `KO_TKO | SUBMISSION | DECISION`; the UI has always shown
 * `KO/TKO | Submission | Decision`. Sending the display spelling is a 422, so
 * this pair of lookups is the only place either vocabulary is written down.
 */
const METHOD_TO_UI: Record<WinMethodWire, WinMethod> = {
  KO_TKO: 'KO/TKO',
  SUBMISSION: 'Submission',
  DECISION: 'Decision',
};

const METHOD_TO_WIRE: Record<WinMethod, WinMethodWire> = {
  'KO/TKO': 'KO_TKO',
  Submission: 'SUBMISSION',
  Decision: 'DECISION',
};

/** Canonical display order, applied because the wire arrives unordered. */
const METHOD_ORDER: WinMethod[] = ['KO/TKO', 'Submission', 'Decision'];

export function toUiMethod(method: WinMethodWire): WinMethod {
  return METHOD_TO_UI[method];
}

export function toWireMethod(method: WinMethod): WinMethodWire {
  return METHOD_TO_WIRE[method];
}

/** Unordered wire methods -> stable, de-duplicated display methods. */
function toUiMethods(methods: WinMethodWire[] | undefined): WinMethod[] {
  const mapped = new Set((methods ?? []).map(toUiMethod).filter(Boolean));
  return METHOD_ORDER.filter((method) => mapped.has(method));
}

const ROUNDS = [1, 2, 3, 4, 5] as const;

/** Unordered wire rounds -> ascending, validated UFC rounds. */
function toUiRounds(rounds: number[] | undefined): Array<1 | 2 | 3 | 4 | 5> {
  const declared = new Set(rounds ?? []);
  return ROUNDS.filter((round) => declared.has(round));
}

// ---------------------------------------------------------------------------
// Display copy for enums
// ---------------------------------------------------------------------------

/**
 * One lock language, keyed on the reasons `MissionReadService._lock` actually
 * emits. Kept in the "…LOCKED…" wording the Home surface already styles on.
 */
export function lockLabelFor(dto: MissionHomeResponseDTO): string {
  if (dto.locked) {
    switch (dto.lock_reason) {
      case 'PICKS_CLOSED':
        return 'MISSIONS LOCKED · PICKS CLOSED';
      case 'RESULTS_STARTED':
        return 'MISSIONS LOCKED · RESULTS STARTED';
      case 'ADMIN_CLOSED':
        return 'MISSIONS LOCKED · CARD CLOSED';
      case 'CARD_NOT_FOUND':
        return 'MISSIONS UNAVAILABLE FOR THIS CARD';
      default:
        return 'MISSIONS LOCKED';
    }
  }
  if (dto.card_state === 'VOID') return 'CARD VOID · MISSIONS LOCKED';
  if (dto.card_state === 'CLOSED') return 'MISSIONS LOCKED · CARD CLOSED';
  return 'MISSIONS OPEN FOR THIS CARD';
}

/** All three UI lock reasons are now reachable: the wire distinguishes them. */
export function slotLockReasonFor(dto: MissionHomeResponseDTO): SlotLockReason {
  switch (dto.lock_reason) {
    case 'RESULTS_STARTED':
      return 'results-started';
    case 'PICKS_CLOSED':
      return 'picks-closed';
    case 'ADMIN_CLOSED':
    case 'CARD_NOT_FOUND':
      return 'admin-closed';
    default:
      return dto.card_state === 'OPEN' ? 'picks-closed' : 'admin-closed';
  }
}

/** Presentation-only formatting of a date the caller supplies. */
export function monthLabelFrom(now: Date): string {
  return now
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

/**
 * `month_key` is "YYYY-MM" — a key, not copy. Formatting it is presentation;
 * the month it names is backend truth and is never shifted by a local timezone
 * (hence UTC noon rather than a bare `new Date(key)`).
 */
export function monthLabelFromKey(monthKey: string | undefined): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey ?? '');
  if (!match) return null;
  const [, year, month] = match;
  return monthLabelFrom(new Date(Date.UTC(Number(year), Number(month) - 1, 1, 12)));
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

const FIGHT_OUTCOME_COPY: Record<string, string> = {
  FINISH: 'Ends inside the distance',
  DECISION: 'Goes to the judges',
  FINISH_ROUND: 'Finishes in an exact round',
};

/** Definition legs -> renderable legs. `key` is carried because the select
 *  command addresses legs by key. */
function toComboLegs(spec: ComboSelectionSpecWire): ComboLegOffer[] {
  return (spec.legs ?? []).map((leg) => ({
    key: leg.key,
    label: leg.label,
    target: leg.target,
    method: leg.method ? toUiMethod(leg.method) : undefined,
    allowedMethods: leg.allowed_methods?.length
      ? toUiMethods(leg.allowed_methods)
      : undefined,
    round: leg.round ?? undefined,
    fightOutcome: leg.fight_outcome ?? undefined,
  }));
}

/**
 * The one-line rule shown above the builder's leg counter.
 *
 * The backend has no such sentence — it has a structured definition — so this
 * assembles display copy from it, the same category of work as `lockLabelFor`.
 * It states what the legs ARE; it never decides whether a draft satisfies them.
 */
function comboLegRule(spec: ComboSelectionSpecWire): string {
  const legs = toComboLegs(spec);
  const count = spec.leg_count;

  if (legs.length > 0 && legs.every((leg) => leg.target === 'FIGHT')) {
    const outcomes = Array.from(
      new Set(legs.map((leg) => FIGHT_OUTCOME_COPY[leg.fightOutcome ?? 'FINISH']))
    );
    return outcomes.length === 1
      ? `${count} fights · ${outcomes[0].toLowerCase()}`
      : outcomes.join(' · ');
  }
  if (legs.length > 0 && legs.every((leg) => leg.method)) {
    return legs.map((leg) => leg.method).join(' · ');
  }
  if (legs.length > 0 && legs.every((leg) => leg.round != null)) {
    return legs.map((leg) => `Round ${leg.round}`).join(' · ');
  }
  if (spec.distinct_methods) {
    return `${count} winners · each by a different method`;
  }
  return `${count} winners`;
}

/**
 * Wire option -> renderable offer, exhaustive over the five families.
 *
 * `pick_effect` rides along on every branch because it is a separate axis: it
 * is copied from the wire, never derived from `interaction`.
 */
export function toMissionOffer(dto: MissionOfferDTO): MissionOffer {
  const base = {
    // The OFFER id addresses the selection. Using `mission_id` here is what
    // made every select call target the wrong thing.
    offerId: dto.offer_id,
    missionId: dto.mission_id,
    name: dto.name,
    description: dto.description,
    difficulty: dto.difficulty,
    xp: dto.xp,
    pickEffect: dto.pick_effect,
    // The wire carries no progress template; the sentence arrives resolved
    // once the mission is active.
    progressTemplate: '',
    selectionPrompt: dto.selection_prompt ?? undefined,
  };

  switch (dto.interaction) {
    case 'AUTO':
      return { ...base, interaction: 'AUTO' };

    case 'TARGET_FIGHTER': {
      const spec = dto.selection_spec;
      // Membership tests, not positional reads: the array is unordered.
      const bound = new Set(spec?.bound_pick_fields ?? []);
      const allowedMethods = toUiMethods(spec?.allowed_methods);
      const allowedRounds = toUiRounds(spec?.allowed_rounds);
      return {
        ...base,
        interaction: 'TARGET_FIGHTER',
        requiresMethod: bound.has('METHOD'),
        requiresRound: bound.has('ROUND'),
        allowedMethods: allowedMethods.length ? allowedMethods : undefined,
        allowedRounds: allowedRounds.length ? allowedRounds : undefined,
        winnerBinding: spec?.winner_binding,
        titleBoutsOnly: spec?.title_bouts_only,
      };
    }

    case 'TARGET_FIGHT': {
      const spec = dto.selection_spec;
      return {
        ...base,
        interaction: 'TARGET_FIGHT',
        outcome: spec?.outcome,
        requiredRound: spec?.required_round ?? undefined,
      };
    }

    case 'COMBO_BUILDER': {
      const spec = dto.selection_spec;
      const legs = toComboLegs(spec);
      return {
        ...base,
        interaction: 'COMBO_BUILDER',
        legCount: spec.leg_count,
        legRule: comboLegRule(spec),
        legLabels: legs.map((leg) => leg.label),
        legs,
        legTarget: legs[0]?.target ?? 'FIGHTER',
        distinctMethods: spec.distinct_methods,
        distinctBouts: spec.distinct_bouts,
        titleBoutsOnly: spec.title_bouts_only,
      };
    }

    case 'CARD_PROP': {
      const spec = dto.selection_spec;
      return {
        ...base,
        interaction: 'CARD_PROP',
        propKind:
          spec.input === 'ACCEPT'
            ? 'accept'
            : spec.input === 'CHOICE'
              ? 'choice'
              : 'exact-count',
        choices: spec.choices?.length ? spec.choices : undefined,
        maxCount: spec.max_count ?? undefined,
        // GAP 5 and 6: no displayed target and no count unit exist on the wire.
      };
    }

    default:
      // Adding a sixth interaction without handling it here fails the build.
      return assertNeverInteraction(dto);
  }
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

/**
 * Read the bout/corner the assignment points at out of the persisted selection.
 *
 * Identifier lookup only — it resolves a portrait. It never reads a method, a
 * round or a target, because those are inputs to a rule the backend already
 * applied.
 */
function targetOf(
  selection: ResolvedSelectionDTO | null | undefined
): { boutId?: number; corner?: 'red' | 'blue' } {
  if (!selection) return {};
  const leg = selection.legs?.[0];
  const boutId =
    selection.bout_id ?? leg?.bout_id ?? selection.bout_ids?.[0] ?? undefined;
  const corner = selection.corner ?? leg?.corner ?? undefined;
  return { boutId, corner };
}

/**
 * GAPS 1, 3 and 4 live here. Everything the meter shows is copied verbatim; the
 * split forms are simply omitted so `ProgressBar` falls back to the sentence.
 */
export function toActiveMission(
  dto: SelectedMissionDTO,
  bouts: LabBout[] = []
): ActiveMissionVM {
  const status: ActiveMissionStatus = dto.status;
  const { boutId, corner } = targetOf(dto.selection);
  const bout = boutId != null ? bouts.find((b) => b.id === boutId) : undefined;

  return {
    missionId: dto.mission_id,
    name: dto.name,
    interaction: dto.interaction,
    difficulty: dto.difficulty,
    xp: dto.xp,
    selectionSummary: dto.selection_summary ?? undefined,
    targetBoutId: boutId,
    targetCorner: corner,
    targetFighter: bout ? (corner === 'blue' ? bout.blue : bout.red) : undefined,
    progressText: dto.progress_text,
    progressPct: dto.progress_percent,
    status,
    voidReason: dto.void_reason ?? undefined,
    earnedXp: dto.xp_earned,
  };
}

// ---------------------------------------------------------------------------
// Monthly
// ---------------------------------------------------------------------------

/** GAP 2: `near-completion` is not reportable, so ACTIVE maps to `active`. */
export function toMonthly(
  dto: MonthlyMissionDTO | null | undefined,
  monthLabel: string
): MonthlyVM {
  if (!dto) return { state: 'not-configured', monthLabel };
  // The month the backend named wins over the client's clock.
  const label = monthLabelFromKey(dto.month_key) ?? monthLabel;

  if (dto.status === 'FAILED' || dto.status === 'VOID') {
    return {
      state: 'month-closed',
      monthLabel: label,
      name: dto.name,
      finalText: dto.progress_text,
    };
  }

  return {
    state: dto.status === 'COMPLETED' ? 'completed' : 'active',
    monthLabel: label,
    name: dto.name,
    description: dto.description,
    progressText: dto.progress_text,
    progressPct: dto.progress_percent,
    xp: dto.xp,
  };
}

// ---------------------------------------------------------------------------
// Slots and Home
// ---------------------------------------------------------------------------

/**
 * The wire is already 1..3 (`MissionSlotView.slot: int = Field(ge=1, le=3)`).
 * The previous mapper added 1 to a zero-based index that never existed, which
 * is why every slot collapsed to 1.
 */
function toSlotNumber(slot: number): 1 | 2 | 3 {
  return slot === 2 ? 2 : slot === 3 ? 3 : 1;
}

export function toSlot(
  dto: MissionSlotDTO,
  home: MissionHomeResponseDTO,
  bouts: LabBout[]
): MissionSlotVM {
  const slot = toSlotNumber(dto.slot);

  if (dto.selected) {
    const mission = toActiveMission(dto.selected, bouts);
    return {
      slot,
      state: dto.selected.status === 'ACTIVE' ? 'active' : 'settled',
      mission,
    };
  }

  if (home.locked) return { slot, state: 'locked', reason: slotLockReasonFor(home) };
  if (dto.options.length === 0) return { slot, state: 'no-offers' };
  return { slot, state: 'open', offers: dto.options.map(toMissionOffer) };
}

export function toHomeMissions(
  dto: MissionHomeResponseDTO,
  card: LabEventContext,
  monthLabel: string
): HomeMissionsVM {
  return {
    event: card,
    lockLabel: lockLabelFor(dto),
    monthly: toMonthly(dto.monthly, monthLabel),
    slots: (dto.slots ?? []).map((slot) => toSlot(slot, dto, card.bouts)),
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const SETTLED: ReadonlyArray<ActiveMissionStatus> = ['COMPLETED', 'FAILED', 'VOID'];

function toHistoryRow(dto: SelectedMissionDTO): HistoryRowVM | null {
  if (!SETTLED.includes(dto.status)) return null;
  return {
    missionName: dto.name,
    // Resolved by the backend. Still falls back to empty rather than inventing
    // a card name when an older payload carries none.
    eventLabel: dto.event_label ?? '',
    difficulty: dto.difficulty,
    status: dto.status as HistoryRowVM['status'],
    xp: dto.xp_earned ?? dto.xp,
  };
}

/**
 * Celebrations carry a typed `metadata` payload beside the display copy, so the
 * union is populated from that rather than by parsing `heading`/`message` back
 * apart. A kind whose payload is incomplete is dropped: a congratulation with
 * the wrong number in it is worse than one that does not appear.
 */
function toCelebration(dto: MissionCelebrationDTO): CelebrationVM | null {
  const meta = (dto.metadata ?? {}) as Record<string, unknown>;
  const num = (key: string): number | null =>
    typeof meta[key] === 'number' ? (meta[key] as number) : null;
  const str = (key: string): string | null =>
    typeof meta[key] === 'string' ? (meta[key] as string) : null;

  switch (dto.kind) {
    case 'MISSION_COMPLETED': {
      const xp = num('xp');
      const name = str('name');
      if (name === null || xp === null) return null;
      return { id: dto.id, kind: 'mission-completed', name, xp };
    }
    case 'LEVEL_UP': {
      const level = num('level');
      const title = str('title');
      if (level === null || title === null) return null;
      return {
        id: dto.id,
        kind: 'level-up',
        level,
        title,
        titleChanged: meta.title_changed === true,
      };
    }
    case 'TITLE_UNLOCKED': {
      const level = num('level');
      const title = str('title');
      if (level === null || title === null) return null;
      return { id: dto.id, kind: 'level-up', level, title, titleChanged: true };
    }
    case 'STREAK_MILESTONE': {
      const count = num('streak');
      const bonusXp = num('bonus_xp');
      if (count === null || bonusXp === null) return null;
      return { id: dto.id, kind: 'streak-milestone', count, bonusXp };
    }
    default:
      return null;
  }
}

export function toProfileHub(
  dto: MissionProfileResponseDTO,
  context: { userName: string; memberSince: string; monthly: MonthlyVM }
): ProfileMissionHubVM {
  return {
    userName: context.userName,
    memberSince: context.memberSince,
    level: {
      level: dto.level,
      title: dto.title,
      xpIntoLevel: dto.xp_into_level,
      xpForNextLevel: dto.xp_for_next_level,
      levelProgressPct: dto.level_progress_pct,
      lifetimeXp: dto.lifetime_xp,
    },
    streak: {
      current: dto.current_streak,
      best: dto.best_streak,
      // Finished copy from the backend; the reward curve is never re-derived here.
      nextMilestoneLabel: dto.next_streak_milestone_label ?? '',
      justBroken: dto.streak_just_broke === true,
    },
    // The profile endpoint now carries its own monthly view; the caller's
    // fallback is used only when it is absent.
    monthly: dto.monthly
      ? toMonthly(dto.monthly, context.monthly.monthLabel)
      : context.monthly,
    activeMissions: (dto.active ?? []).map((a) => toActiveMission(a)),
    history: (dto.history ?? [])
      .map(toHistoryRow)
      .filter((row): row is HistoryRowVM => row !== null),
    pendingCelebrations: (dto.celebrations ?? [])
      .map(toCelebration)
      .filter((row): row is CelebrationVM => row !== null),
  };
}

// ---------------------------------------------------------------------------
// Outbound selection payload
// ---------------------------------------------------------------------------

/**
 * Drawer draft -> wire payload, exhaustive over the same five families.
 *
 * The offer travels with the draft because the backend rejects fields the
 * definition did not ask for: a method on a mission that binds none, a corner
 * on a FIGHT leg, or a method on a leg whose method the catalog already fixed.
 * Those are 409 INVALID_SELECTION, so they are filtered here rather than sent
 * and apologised for.
 *
 * AUTO sends `null`; the router fills in `{"kind": "AUTO"}` itself.
 */
export function toSelectionPayload(
  selection: MockSelection,
  offer?: MissionOffer
): MissionSelectionPayloadDTO | null {
  switch (selection.kind) {
    case 'AUTO':
      return null;

    case 'TARGET_FIGHTER': {
      const spec = offer?.interaction === 'TARGET_FIGHTER' ? offer : undefined;
      // When the offer is unknown, trust the draft: the drawer only ever puts a
      // method on it when the picker asked for one.
      const wantsMethod = spec ? spec.requiresMethod === true : true;
      const wantsRound = spec ? spec.requiresRound === true : true;
      return {
        kind: 'TARGET_FIGHTER',
        bout_id: selection.boutId,
        corner: selection.corner,
        ...(wantsMethod && selection.method
          ? { method: toWireMethod(selection.method) }
          : {}),
        ...(wantsRound && selection.round ? { round: selection.round } : {}),
      };
    }

    case 'TARGET_FIGHT':
      return { kind: 'TARGET_FIGHT', bout_id: selection.boutId };

    case 'COMBO_BUILDER': {
      const combo = offer?.interaction === 'COMBO_BUILDER' ? offer : undefined;
      const legsByKey = new Map(
        (combo?.legs ?? []).map((leg) => [leg.key, leg] as const)
      );
      return {
        kind: 'COMBO_BUILDER',
        legs: selection.legs.map((leg, index) => {
          // Fall back to positional keys only when the offer carried none.
          const key = leg.key ?? combo?.legs?.[index]?.key ?? '';
          const spec = legsByKey.get(key);
          const isFightLeg = spec?.target === 'FIGHT';
          // A leg whose method the catalog fixed must not echo it back.
          const sendsMethod = !isFightLeg && (spec?.allowedMethods?.length ?? 0) > 0;
          return {
            key,
            bout_id: leg.boutId,
            ...(isFightLeg || !leg.corner ? {} : { corner: leg.corner }),
            ...(sendsMethod && leg.method
              ? { method: toWireMethod(leg.method) }
              : {}),
          };
        }),
      };
    }

    case 'CARD_PROP':
      return {
        kind: 'CARD_PROP',
        ...(selection.choice !== undefined ? { choice: selection.choice } : {}),
        ...(selection.exactCount !== undefined
          ? { exact_count: selection.exactCount }
          : {}),
      };

    default:
      return assertNeverInteraction(selection);
  }
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/** FNV-1a, 32-bit. Not security — just a short stable digest of a request. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * A deterministic idempotency key for one selection attempt.
 *
 * Derived from the request rather than randomly generated, so a retry of the
 * SAME selection reuses the SAME key and the backend replays its receipt
 * instead of creating a second assignment. A different selection hashes
 * differently, so it can never collide into an `IDEMPOTENCY_CONFLICT` (which
 * the backend raises for one key reused with a different request).
 *
 * The result matches `^[A-Za-z0-9._:-]+$` and stays inside 8..128 characters,
 * which `SelectMissionCommand` enforces.
 */
export function idempotencyKeyFor(request: {
  eventId: number;
  slot: 1 | 2 | 3;
  offerId: string;
  selection: MissionSelectionPayloadDTO | null;
}): string {
  const digest = fnv1a(
    `${request.eventId}|${request.slot}|${request.offerId}|${JSON.stringify(
      request.selection
    )}`
  );
  return `mx.${request.eventId}.${request.slot}.${digest}`;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function toCardControl(dto: CardControlDTO): CardControlVM {
  return {
    eventId: dto.event_id,
    state: dto.state,
    reason: dto.reason ?? null,
    actorId: dto.actor_id ?? null,
    updatedAt: dto.updated_at ?? null,
    voidedAssignments: dto.voided_assignments ?? 0,
    revision: dto.revision ?? 0,
  };
}

/**
 * Field values are rendered as one readable line here rather than in the panel,
 * because the operator has to read what actually changes before approving it and
 * the payload is free-form by design.
 */
function fieldLine(
  values: Record<string, unknown> | null | undefined,
  fields: string[]
): string {
  if (!values) return '(none)';
  return fields.map((field) => `${field}=${String(values[field] ?? '-')}`).join(', ');
}

export function toReconciliationPreview(
  dto: ReconciliationPreviewDTO
): ReconciliationPreviewVM {
  return {
    planId: dto.plan_id,
    converged: dto.converged,
    safeToApply: dto.safe_to_apply,
    operations: (dto.operations ?? []).map((op) => ({
      operationId: op.operation_id,
      action: op.action,
      entityType: op.entity_type,
      entityId: op.entity_id,
      impact: op.impact,
      changedFields: op.changed_fields,
      beforeText: fieldLine(op.before, op.changed_fields),
      afterText: fieldLine(op.after, op.changed_fields),
    })),
    unchangedCount: (dto.unchanged_entities ?? []).length,
    blockers: dto.blockers ?? [],
  };
}
