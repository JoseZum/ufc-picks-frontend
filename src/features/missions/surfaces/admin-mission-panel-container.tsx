'use client';

/**
 * Slice 4 — the Admin mission panel against the real API.
 *
 * The panel renders and confirms; this container is what actually calls the
 * gateway, so a rejected action surfaces its reason instead of appearing to
 * have worked. Every action here requires the Admin role and is audited
 * server-side with an actor and a reason.
 */

import React from 'react';
import {
  MissionsErrorState,
  MissionsLoadingState,
  MissionsUnavailableState,
} from '../components/mission-states';
import type {
  AdminEventMissionRowVM,
  AdminMissionsVM,
  ReconciliationRowVM,
} from '../contracts/mission-mock-models';
import { createHttpMissionGateway } from '../gateway/http-mission-gateway';
import type { MissionGateway } from '../gateway/mission-gateway';
import { AdminMissionPanel, type AdminPanelAction } from './admin-mission-panel';

export interface AdminMissionPanelContainerProps {
  /** The cards Admin can operate on, from the page's existing event list. */
  events: Array<{ id: number; label: string }>;
  gateway?: MissionGateway;
}

type Phase =
  | { status: 'loading' }
  | { status: 'ready'; state: AdminMissionsVM }
  | { status: 'error'; message: string };

/** The reconciliation table is display-only, so the mapping is a rendering. */
function toReconciliationRows(
  operations: Array<{
    entityType: string;
    entityId: string;
    beforeText: string;
    afterText: string;
  }>
): ReconciliationRowVM[] {
  return operations.map((operation) => ({
    missionName: operation.entityType,
    user: operation.entityId,
    current: operation.beforeText,
    desired: operation.afterText,
    // Reconciliation repairs derived caches; it never awards or revokes XP.
    action: 'no-change',
  }));
}

export function AdminMissionPanelContainer({
  events,
  gateway,
}: AdminMissionPanelContainerProps) {
  const resolved = React.useMemo(
    () => gateway ?? createHttpMissionGateway(),
    [gateway]
  );
  const admin = resolved.admin;

  const [phase, setPhase] = React.useState<Phase>({ status: 'loading' });
  const [reloads, setReloads] = React.useState(0);
  const reload = React.useCallback(() => setReloads((n) => n + 1), []);

  const eventKey = React.useMemo(
    () => events.map((event) => `${event.id}:${event.label}`).join('|'),
    [events]
  );

  React.useEffect(() => {
    if (!admin || events.length === 0) return;
    let cancelled = false;
    setPhase({ status: 'loading' });

    (async () => {
      const rows: AdminEventMissionRowVM[] = [];
      for (const event of events) {
        const control = await admin.getCardControl(event.id);
        rows.push({
          eventId: event.id,
          eventLabel: event.label,
          missionState: control.state.toLowerCase() as AdminEventMissionRowVM['missionState'],
          selectedCount: 0,
          canReopen: control.state === 'CLOSED',
          reopenBlockedReason:
            control.state === 'VOID' ? 'VOID is irreversible' : undefined,
        });
      }

      // Scoped to the first card on screen: a global preview would be a very
      // expensive read to run on every panel load.
      const preview = await admin.previewReconciliation({ eventId: events[0].id });

      if (cancelled) return;
      setPhase({
        status: 'ready',
        state: {
          monthly: {
            state: 'ACTIVE',
            monthLabel: new Date()
              .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              .toUpperCase(),
            templateName: '—',
            templateId: '',
            params: [],
          },
          events: rows,
          reconciliationPreview: toReconciliationRows(preview.operations),
          auditLog: [],
        },
      });
    })().catch((cause: unknown) => {
      if (cancelled) return;
      setPhase({
        status: 'error',
        message:
          cause instanceof Error ? cause.message : 'Admin mission state could not load.',
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, eventKey, reloads]);

  const onAction = React.useCallback(
    async (action: AdminPanelAction) => {
      if (!admin) return;
      if (action.kind !== 'card') {
        // Monthly configuration lives on its own Admin screen; the panel only
        // links to it, so confirming here must not pretend to have acted.
        throw new Error('Monthly configuration is managed on the monthly screen.');
      }
      const reason = window.prompt(`Reason for "${action.label}"`)?.trim();
      if (!reason) throw new Error('A reason is required for every Admin action.');
      await admin.actOnCard({
        eventId: action.eventId,
        action: action.action,
        reason,
      });
      reload();
    },
    [admin, reload]
  );

  if (!admin) {
    return <MissionsUnavailableState message="Mission admin is unavailable on this gateway." />;
  }
  if (events.length === 0) {
    return <MissionsUnavailableState message="No card to operate on yet." />;
  }
  if (phase.status === 'loading') return <MissionsLoadingState />;
  if (phase.status === 'error') {
    return <MissionsErrorState message={phase.message} onRetry={reload} />;
  }

  return <AdminMissionPanel state={phase.state} onAction={onAction} />;
}
