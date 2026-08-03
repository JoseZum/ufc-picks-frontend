/**
 * FE-000A — MissionGateway-shaped boundary for the Lab.
 *
 * The interface mirrors the intended shape of the future gateway (D-ARCH-011)
 * so surfaces never touch fixtures directly, but the payloads are mock-only
 * and explicitly NOT Contract V1.
 */

import type {
  ActiveMissionVM,
  AdminMissionsVM,
  HomeMissionsVM,
  LabEventContext,
  MissionOffer,
  MockSelection,
  ProfileMissionHubVM,
  AdminMonthlyVM,
  CardControlVM,
  ReconciliationPreviewVM,
  ReconciliationResultVM,
} from '../contracts/mission-mock-models';
import type { PickPatchInput } from '../renderers/pick-completion';
import type { MonthlyTemplateDTO } from '../contracts/mission-api-contracts';

export interface MissionLabGateway {
  getHomeState(): Promise<HomeMissionsVM>;
  getProfileState(): Promise<ProfileMissionHubVM>;
  getAdminState(): Promise<AdminMissionsVM>;
  /**
   * Atomic selection: slot + offer + target payload in one irreversible call.
   * The mock resolves with the resulting active mission; the real adapter will
   * be defined by Contract V1 later.
   */
  selectMission(
    slot: 1 | 2 | 3,
    offerId: string,
    selection: MockSelection
  ): Promise<ActiveMissionVM>;
  acknowledgeCelebration(index: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Production boundary
// ---------------------------------------------------------------------------

/**
 * The boundary the real surfaces talk to. Two adapters implement it — `mock`
 * (deterministic fixtures, used by the Lab and by tests) and `http` (the real
 * API) — and one shared contract suite runs against both, so a surface cannot
 * tell them apart.
 *
 * Every method returns presentation-ready view models. No caller of this
 * interface is permitted to recompute progress, XP, eligibility or lock state.
 */
export interface MissionGateway {
  getHome(request: MissionHomeRequest): Promise<HomeMissionsVM>;
  getProfile(): Promise<ProfileMissionHubVM>;
  /** Irreversible, one call: slot + offer + target payload together. */
  select(request: MissionSelectRequest): Promise<ActiveMissionVM>;
  /** Idempotent acknowledgement by stable celebration id. */
  acknowledgeCelebration(celebrationId: string): Promise<void>;

  /**
   * Admin surface. Optional because the mock adapter the Lab uses has no Admin
   * authority to model; a surface that needs these must check for them.
   */
  admin?: MissionAdminGateway;
}

/** Every method here requires the Admin role and is audited server-side. */
export interface MissionAdminGateway {
  /**
   * The month's real configuration. The panel used to hard-code `ACTIVE` with
   * an em dash for a name, which told an operator a DRAFT month was live.
   */
  getMonthly(monthKey: string): Promise<AdminMonthlyVM>;
  /** The 18 reviewed templates: parameter labels and the bounds Admin may use. */
  getMonthlyTemplates(): Promise<MonthlyTemplateDTO[]>;
  /** DRAFT -> ACTIVE, or ACTIVE -> CLOSED. Both are idempotent server-side. */
  actOnMonthly(request: MonthlyActionRequest): Promise<AdminMonthlyVM>;
  getCardControl(eventId: number): Promise<CardControlVM>;
  /** `reason` is mandatory: an action on live user state must say why. */
  actOnCard(request: CardActionRequest): Promise<CardControlVM>;
  previewReconciliation(scope: ReconciliationScopeRequest): Promise<ReconciliationPreviewVM>;
  /** Echoes back the `planId` the operator reviewed; a stale plan is refused. */
  applyReconciliation(
    request: ReconciliationScopeRequest & { planId: string; reason: string }
  ): Promise<ReconciliationResultVM>;
}

export interface CardActionRequest {
  eventId: number;
  action: 'close' | 'reopen' | 'void';
  reason: string;
}

export interface MonthlyActionRequest {
  monthKey: string;
  action: 'activate' | 'close';
}

export interface ReconciliationScopeRequest {
  eventId?: number;
  userId?: string;
  assignmentId?: string;
}

export interface MissionHomeRequest {
  eventId: number;
  /**
   * Card context (name, art, bouts) resolved from the product's existing event
   * endpoints. Missions never re-fetch the card: the drawer's pickers and the
   * mission payload must describe the same fights.
   */
  card: LabEventContext;
}

export interface MissionSelectRequest {
  eventId: number;
  slot: 1 | 2 | 3;
  /** The offer as rendered. `offerId` addresses the selection on BOTH adapters:
   *  it is the API's `offer_id`, not the catalog's `mission_id`. */
  offer: MissionOffer;
  selection: MockSelection;
  /**
   * Method/round the user supplied for bouts the mission binds but has not
   * fixed and they have never picked. Empty for every mission with no pick
   * effect, and for anyone who already filled the card.
   */
  pickPatches?: PickPatchInput[];
  /**
   * Optional override for the request's idempotency key. Left unset the adapter
   * derives a deterministic one from the request itself, so retrying the same
   * selection replays the original receipt instead of creating a second
   * assignment.
   */
  idempotencyKey?: string;
}

/**
 * Codes surfaces are allowed to branch on. The conflict codes mirror
 * `MissionSelectionErrorCode` on the backend so a refusal keeps its meaning all
 * the way to the drawer.
 */
export type MissionGatewayErrorCode =
  | 'UNAUTHENTICATED'
  | 'ALREADY_SELECTED'
  | 'SLOT_LOCKED'
  | 'CARD_LOCKED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'OFFER_NOT_FOUND'
  | 'STALE_CARD'
  | 'INVALID_SELECTION'
  | 'PICK_LOCKED'
  | 'NOT_AVAILABLE'
  | 'NETWORK'
  | 'UNKNOWN';

export class MissionGatewayError extends Error {
  readonly code: MissionGatewayErrorCode;
  readonly status?: number;

  constructor(code: MissionGatewayErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'MissionGatewayError';
    this.code = code;
    this.status = status;
  }
}
