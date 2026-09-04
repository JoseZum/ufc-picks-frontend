'use client';

/**
 * FE-000A — Admin mission panel prototype.
 *
 * Monthly lifecycle (DRAFT/ACTIVE/CLOSED), per-event close/reopen/VOID and a
 * read-only reconciliation preview.
 *
 * The panel itself performs no request. When a caller supplies `onAction` the
 * confirmed action is handed to it and the caller talks to the gateway; without
 * one — the Lab — the action is simulated into the local audit log. That is why
 * the confirmation copy is chosen from the same signal.
 */

import React from 'react';
import type { AdminMissionsVM, ReconciliationRowVM } from '../contracts/mission-mock-models';

const ACTION_LABEL: Record<ReconciliationRowVM['action'], string> = {
  'award-xp': 'AWARD XP',
  'revoke-xp': 'REVOKE XP',
  'mark-void': 'MARK VOID',
  'no-change': 'NO CHANGE',
};

/** A confirmed action, described so the caller can route it to the API. */
export type AdminPanelAction =
  | { kind: 'card'; eventId: number; action: 'close' | 'reopen' | 'void'; label: string }
  | { kind: 'monthly'; action: 'activate' | 'close'; label: string }
  | {
      kind: 'monthly-save';
      missionId: string;
      parameters: Record<string, number>;
      label: string;
    }
  | { kind: 'reconcile'; label: string };

export interface AdminMissionPanelProps {
  state: AdminMissionsVM;
  /** Absent means prototype mode: actions are simulated, never sent. */
  onAction?: (action: AdminPanelAction) => Promise<void>;
}

export function AdminMissionPanel({ state, onAction }: AdminMissionPanelProps) {
  const [log, setLog] = React.useState<string[]>(state.auditLog);
  const [pending, setPending] = React.useState<AdminPanelAction | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  // The form is controlled so the chosen template and numbers can actually be
  // sent. Re-seeded from the server on every load, because the server is the
  // authority on what the month currently is.
  const [draftTemplate, setDraftTemplate] = React.useState(state.monthly.templateId);
  const [draftParams, setDraftParams] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(state.monthly.params.map((p) => [p.key, p.value]))
  );

  React.useEffect(() => setLog(state.auditLog), [state.auditLog]);
  React.useEffect(() => {
    setDraftTemplate(state.monthly.templateId);
    setDraftParams(
      Object.fromEntries(state.monthly.params.map((p) => [p.key, p.value]))
    );
  }, [state.monthly.templateId, state.monthly.params]);

  const setPendingAction = (action: AdminPanelAction) => {
    setFailure(null);
    setPending(action);
  };

  const confirm = async () => {
    if (!pending) return;
    if (!onAction) {
      setLog((prev) => [`[simulated] ${pending.label}`, ...prev]);
      setPending(null);
      return;
    }
    setBusy(true);
    try {
      await onAction(pending);
      setPending(null);
    } catch (cause) {
      // The action stays on screen with the reason: an Admin needs to know a
      // VOID did not happen far more than they need the dialog to close.
      setFailure(cause instanceof Error ? cause.message : 'The action was rejected.');
    } finally {
      setBusy(false);
    }
  };

  const editable = state.monthly.state === 'DRAFT';
  const selectedTemplate = state.monthly.templates?.find(
    (template) => template.id === draftTemplate
  );
  const visibleParams = selectedTemplate?.params ?? state.monthly.params;
  const changes = state.reconciliationPreview.filter((r) => r.action !== 'no-change').length;

  return (
    <section className="ml-section" aria-labelledby="ml-admin-title">
      <div className="ml-section__header">
        <h2 className="ml-section__title" id="ml-admin-title">
          MISSIONS · ADMIN
        </h2>
      </div>

      <div className="ml-admin-grid">
        <div className="ml-admin-card">
          <div className="ml-admin-card__title">
            MONTHLY MISSION
            <span className={`ml-state-badge ml-state-badge--${state.monthly.state.toLowerCase()}`}>
              {state.monthly.state}
            </span>
            <span className="ml-drawer__eyebrow">{state.monthly.monthLabel}</span>
          </div>

          <div className="ml-param-row">
            <label htmlFor="ml-template">Template</label>
            <select
              id="ml-template"
              disabled={!editable}
              value={draftTemplate}
              onChange={(event) => {
                // A different template has different parameters; keeping the
                // old numbers would submit values the new one never declared.
                const nextTemplateId = event.target.value;
                const nextTemplate = state.monthly.templates?.find(
                  (template) => template.id === nextTemplateId
                );
                setDraftTemplate(nextTemplateId);
                setDraftParams(
                  Object.fromEntries(
                    (nextTemplate?.params ?? []).map((param) => [param.key, param.value])
                  )
                );
              }}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                padding: '0.4rem 0.5rem',
              }}
            >
              {(
                state.monthly.templates ?? [
                  {
                    id: state.monthly.templateId,
                    name: state.monthly.templateName,
                    params: state.monthly.params,
                  },
                ]
              ).map((template) => (
                <option value={template.id} key={template.id}>
                  {template.name} ({template.id})
                </option>
              ))}
            </select>
          </div>

          {visibleParams.map((param) => (
            <div className="ml-param-row" key={param.key}>
              <label htmlFor={`ml-param-${param.key}`}>{param.label}</label>
              <input
                id={`ml-param-${param.key}`}
                type="number"
                value={draftParams[param.key] ?? param.value}
                min={param.min}
                max={param.max}
                disabled={!editable}
                onChange={(event) =>
                  setDraftParams((prev) => ({
                    ...prev,
                    [param.key]: Number(event.target.value),
                  }))
                }
              />
              {/* The reviewed range, so an operator knows what the API will
                  accept before it refuses. Validation stays server-side. */}
              {param.min != null && param.max != null ? (
                <span className="ml-admin-note">
                  {param.min}–{param.max}
                </span>
              ) : null}
            </div>
          ))}

          {state.monthly.validationNote ? (
            <p className="ml-admin-note">{state.monthly.validationNote}</p>
          ) : null}

          <div className="ml-confirm__actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="ml-btn ml-btn--primary"
              disabled={!editable || !draftTemplate}
              onClick={() =>
                setPendingAction({
                  kind: 'monthly-save',
                  missionId: draftTemplate,
                  parameters: draftParams,
                  label: `Save ${state.monthly.monthLabel} as a draft`,
                })
              }
            >
              Save draft
            </button>
            <button
              type="button"
              className="ml-btn"
              disabled={!editable}
              onClick={() =>
                setPendingAction({
                  kind: 'monthly',
                  action: 'activate',
                  label: 'Activate monthly mission for the selected month',
                })
              }
            >
              Activate month
            </button>
            <button
              type="button"
              className="ml-btn"
              disabled={state.monthly.state !== 'ACTIVE'}
              onClick={() =>
                setPendingAction({
                  kind: 'monthly',
                  action: 'close',
                  label: 'Close the active monthly mission',
                })
              }
            >
              Close month
            </button>
          </div>
        </div>

        <div className="ml-admin-card">
          <div className="ml-admin-card__title">CARD MISSION OPERATIONS</div>
          {state.events.map((ev) => (
            <div className="ml-admin-event" key={ev.eventId}>
              <span className="ml-admin-event__label">
                {ev.eventLabel}
                <span className="ml-admin-event__sub">
                  {ev.selectedCount} missions selected by users ·{' '}
                  {ev.reopenBlockedReason ?? 'reopen allowed before results'}
                </span>
              </span>
              <span className={`ml-state-badge ml-state-badge--${ev.missionState === 'open' ? 'active' : 'closed'}`}>
                {ev.missionState.toUpperCase()}
              </span>
              <span className="ml-admin-event__actions">
                <button
                  type="button"
                  className="ml-btn"
                  disabled={ev.missionState !== 'open'}
                  onClick={() =>
                    setPendingAction({
                      kind: 'card',
                      eventId: ev.eventId,
                      action: 'close',
                      label: `Close missions for ${ev.eventLabel}`,
                    })
                  }
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ml-btn"
                  disabled={!ev.canReopen}
                  onClick={() =>
                    setPendingAction({
                      kind: 'card',
                      eventId: ev.eventId,
                      action: 'reopen',
                      label: `Reopen missions for ${ev.eventLabel}`,
                    })
                  }
                >
                  Reopen
                </button>
                <button
                  type="button"
                  className="ml-btn ml-btn--danger"
                  disabled={ev.missionState === 'void'}
                  onClick={() =>
                    setPendingAction({
                      kind: 'card',
                      eventId: ev.eventId,
                      action: 'void',
                      label: `VOID all missions for ${ev.eventLabel}`,
                    })
                  }
                >
                  Void
                </button>
              </span>
            </div>
          ))}
        </div>

        <div className="ml-admin-card">
          <div className="ml-admin-card__title">
            RECONCILIATION PREVIEW
            <span className="ml-drawer__eyebrow">READ-ONLY · {changes} CHANGES</span>
          </div>
          {state.reconciliationPreview.length === 0 ? (
            <p className="ml-history__empty">
              No divergence detected. Nothing to reconcile for this selection.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ml-recon">
                <thead>
                  <tr>
                    <th scope="col">Mission</th>
                    <th scope="col">User</th>
                    <th scope="col">Current</th>
                    <th scope="col">Desired</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.reconciliationPreview.map((row, i) => (
                    <tr key={`${row.missionName}-${i}`}>
                      <td>{row.missionName}</td>
                      <td>{row.user}</td>
                      <td>{row.current}</td>
                      <td>{row.desired}</td>
                      <td className={`ml-recon__action--${row.action}`}>{ACTION_LABEL[row.action]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="ml-admin-note">
            Preview never writes. Applying reconciliation is a separate, explicit action.
          </p>

          <div className="ml-audit">
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      </div>

      {pending ? (
        <div className="ml-celebration" role="dialog" aria-modal="true" aria-label="Confirm admin action">
          <span className="ml-celebration__eyebrow">CONFIRM ADMIN ACTION</span>
          <p className="ml-confirm__summary" style={{ maxWidth: '32rem' }}>
            {pending.label}
          </p>
          <p className="ml-confirm__warning">
            {onAction
              ? pending.kind === 'card' && pending.action === 'void'
                ? 'VOID is irreversible. Every active mission on this card is settled.'
                : 'This action is recorded against your Admin account.'
              : 'Prototype only. This simulates the action and writes to the local audit log.'}
          </p>
          {failure ? (
            <p className="ml-confirm__warning" role="alert">
              {failure}
            </p>
          ) : null}
          <div className="ml-confirm__actions">
            <button
              type="button"
              className="ml-btn ml-btn--ghost"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ml-btn ml-btn--primary"
              disabled={busy}
              onClick={confirm}
            >
              {busy ? 'Working…' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
