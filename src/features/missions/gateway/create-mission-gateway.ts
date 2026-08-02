/**
 * Chooses which `MissionGateway` adapter the running app uses.
 *
 * Default is `http` — the real API. Set `NEXT_PUBLIC_MISSION_GATEWAY=mock` to
 * drive the production surfaces from the deterministic fixtures instead, which
 * is how the Home integration is exercised locally while the mission endpoints
 * are still being built. It is an explicit opt-in: a failing HTTP call never
 * silently falls back to fixtures, because fake data that looks real is worse
 * than an honest error state.
 */

import type { MissionGateway } from './mission-gateway';
import { createHttpMissionGateway } from './http-mission-gateway';
import { createMockGateway } from './mock-mission-gateway-adapter';

export type MissionGatewayKind = 'http' | 'mock';

export function resolveMissionGatewayKind(): MissionGatewayKind {
  return process.env.NEXT_PUBLIC_MISSION_GATEWAY === 'mock' ? 'mock' : 'http';
}

export function createMissionGateway(
  kind: MissionGatewayKind = resolveMissionGatewayKind()
): MissionGateway {
  return kind === 'mock' ? createMockGateway() : createHttpMissionGateway();
}
