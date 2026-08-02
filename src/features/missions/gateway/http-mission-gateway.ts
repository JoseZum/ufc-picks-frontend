/**
 * HTTP adapter for `MissionGateway`.
 *
 * Talks to the real mission endpoints and hands the surfaces the exact same
 * view models the mock adapter produces:
 *
 *   GET  {api}/missions/home?event_id=<int>
 *   POST {api}/missions/select                              -> 201
 *   GET  {api}/missions/profile
 *   POST {api}/missions/celebrations/{celebration_id}/ack   -> 204
 *
 * Auth reuses the application's existing scheme — the bearer token stored by
 * `@/lib/api` — because there is exactly one login in this product and missions
 * do not get their own.
 *
 * Two things this adapter gets right that the first version did not, both of
 * them load-bearing:
 *
 *  1. `POST /missions/select` sends `{event_id, slot, offer_id, idempotency_key,
 *     selection}`. Slots are one-based and the id is the OFFER id. Sending
 *     `slot_index`/`mission_id` is a 422 from pydantic before any handler runs.
 *  2. FastAPI wraps every error body in `detail`. A mission `HTTPException`
 *     carries `{"detail": {"code", "message"}}`, so reading `code` at the root
 *     silently found nothing and every refusal degraded to UNKNOWN.
 *
 * `fetchImpl`, `getToken` and `now` are injectable so the shared gateway
 * contract suite can drive this adapter without a network or a browser.
 */

import { getApiUrl, getAuthToken } from '@/lib/api';
import type {
  MissionGateway,
  MissionGatewayErrorCode,
  MissionHomeRequest,
  MissionSelectRequest,
  CardActionRequest,
  ReconciliationScopeRequest,
} from './mission-gateway';
import { MissionGatewayError } from './mission-gateway';
import type {
  MissionErrorBodyDTO,
  MissionHomeResponseDTO,
  MissionProfileResponseDTO,
  MissionSelectRequestDTO,
  MissionSelectResponseDTO,
  CardControlDTO,
  ReconciliationPreviewDTO,
  ReconciliationApplyDTO,
} from '../contracts/mission-api-contracts';
import {
  idempotencyKeyFor,
  monthLabelFrom,
  toActiveMission,
  toHomeMissions,
  toProfileHub,
  toSelectionPayload,
  toCardControl,
  toReconciliationPreview,
} from './mission-api-mappers';

export interface HttpMissionGatewayOptions {
  /** Defaults to the application's configured API base. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Defaults to the app's stored bearer token. */
  getToken?: () => string | null;
  /** Injectable clock; only used to label the current month. */
  now?: () => Date;
  /** Display-only context the profile endpoint does not carry. */
  profileContext?: () => { userName: string; memberSince: string };
}

/**
 * `MissionSelectionErrorCode` plus the router's own codes, mapped onto the
 * codes surfaces branch on. Anything unrecognised stays UNKNOWN rather than
 * being coerced into a conflict the backend did not report.
 */
const ERROR_CODES: Record<string, MissionGatewayErrorCode> = {
  ALREADY_SELECTED: 'ALREADY_SELECTED',
  SLOT_LOCKED: 'SLOT_LOCKED',
  CARD_LOCKED: 'CARD_LOCKED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
  STALE_CARD: 'STALE_CARD',
  INVALID_SELECTION: 'INVALID_SELECTION',
  PICK_LOCKED: 'PICK_LOCKED',
  CARD_NOT_FOUND: 'NOT_AVAILABLE',
};

/**
 * Pull `{code, message}` out of whatever FastAPI produced. Three shapes are
 * possible and all three arrive under `detail`: a mission error object, a bare
 * string (`{"detail": "Not authenticated"}`) and a 422 validation array.
 */
function readDetail(body: unknown): { code?: string; message?: string } {
  const detail = (body as MissionErrorBodyDTO | null)?.detail;
  if (detail == null) return {};
  if (typeof detail === 'string') return { message: detail };
  if (Array.isArray(detail)) {
    const first = detail[0];
    const where = Array.isArray(first?.loc) ? first.loc.join('.') : '';
    const what = first?.msg ?? 'Request was rejected';
    return { message: where ? `${what} (${where})` : what };
  }
  return { code: detail.code, message: detail.message };
}

export function createHttpMissionGateway(
  options: HttpMissionGatewayOptions = {}
): MissionGateway {
  const {
    baseUrl = getApiUrl(),
    getToken = getAuthToken,
    now = () => new Date(),
    profileContext = () => ({ userName: '', memberSince: '' }),
  } = options;

  const doFetch: typeof fetch =
    options.fetchImpl ?? ((input, init) => fetch(input, init));

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) ?? {}),
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, { ...init, headers });
    } catch (cause) {
      throw new MissionGatewayError(
        'NETWORK',
        cause instanceof Error ? cause.message : 'Network request failed'
      );
    }

    if (response.status === 204) return undefined as T;

    if (!response.ok) throw await toGatewayError(response);

    return (await response.json()) as T;
  }

  async function toGatewayError(response: Response): Promise<MissionGatewayError> {
    const body = await response.json().catch(() => null);
    const { code, message } = readDetail(body);

    if (response.status === 401 || response.status === 403) {
      return new MissionGatewayError(
        'UNAUTHENTICATED',
        'Sign in to accept missions.',
        response.status
      );
    }

    // The code is authoritative wherever the backend sent one: the same
    // `CARD_NOT_FOUND` arrives as 404 from the router and the status alone
    // cannot tell a missing card from a missing offer.
    const mapped = code ? ERROR_CODES[code] : undefined;
    if (mapped) {
      return new MissionGatewayError(
        mapped,
        message ?? 'This slot already changed.',
        response.status
      );
    }

    if (response.status === 404) {
      return new MissionGatewayError(
        'NOT_AVAILABLE',
        message ?? 'Missions are not available for this card yet.',
        404
      );
    }

    return new MissionGatewayError(
      'UNKNOWN',
      message ?? `HTTP ${response.status}`,
      response.status
    );
  }

  return {
    async getHome(req: MissionHomeRequest) {
      const dto = await request<MissionHomeResponseDTO>(
        `/missions/home?event_id=${encodeURIComponent(String(req.eventId))}`
      );
      return toHomeMissions(dto, req.card, monthLabelFrom(now()));
    },

    async getProfile() {
      const dto = await request<MissionProfileResponseDTO>('/missions/profile');
      const { userName, memberSince } = profileContext();
      return toProfileHub(dto, {
        userName,
        memberSince,
        // Fallback only: the endpoint carries its own monthly view when the
        // month is configured.
        monthly: { state: 'not-configured', monthLabel: monthLabelFrom(now()) },
      });
    },

    async select(req: MissionSelectRequest) {
      const selection = toSelectionPayload(req.selection, req.offer);
      const body: MissionSelectRequestDTO = {
        event_id: req.eventId,
        slot: req.slot,
        offer_id: req.offer.offerId,
        idempotency_key:
          req.idempotencyKey ??
          idempotencyKeyFor({
            eventId: req.eventId,
            slot: req.slot,
            offerId: req.offer.offerId,
            selection,
          }),
        selection,
      };
      const dto = await request<MissionSelectResponseDTO>('/missions/select', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return toActiveMission(dto);
    },

    async acknowledgeCelebration(celebrationId: string) {
      await request<void>(
        `/missions/celebrations/${encodeURIComponent(celebrationId)}/ack`,
        { method: 'POST' }
      );
    },

    admin: {
      async getCardControl(eventId: number) {
        return toCardControl(
          await request<CardControlDTO>(`/admin/missions/cards/${eventId}`)
        );
      },

      async actOnCard(req: CardActionRequest) {
        return toCardControl(
          await request<CardControlDTO>(
            `/admin/missions/cards/${req.eventId}/${req.action}`,
            { method: 'POST', body: JSON.stringify({ reason: req.reason }) }
          )
        );
      },

      async previewReconciliation(scope: ReconciliationScopeRequest) {
        return toReconciliationPreview(
          await request<ReconciliationPreviewDTO>(
            `/admin/missions/reconciliation/preview?${scopeQuery(scope)}`
          )
        );
      },

      async applyReconciliation(req) {
        const dto = await request<ReconciliationApplyDTO>(
          '/admin/missions/reconciliation/apply',
          {
            method: 'POST',
            body: JSON.stringify({
              plan_id: req.planId,
              reason: req.reason,
              event_id: req.eventId ?? null,
              user_id: req.userId ?? null,
              assignment_id: req.assignmentId ?? null,
            }),
          }
        );
        return {
          planId: dto.plan_id,
          applied: dto.applied,
          skipped: dto.skipped,
          converged: dto.converged,
        };
      },
    },
  };
}

/** Only the keys the caller actually set: the API rejects an empty scope. */
function scopeQuery(scope: ReconciliationScopeRequest): string {
  const params = new URLSearchParams();
  if (scope.eventId !== undefined) params.set('event_id', String(scope.eventId));
  if (scope.userId !== undefined) params.set('user_id', scope.userId);
  if (scope.assignmentId !== undefined) params.set('assignment_id', scope.assignmentId);
  return params.toString();
}
