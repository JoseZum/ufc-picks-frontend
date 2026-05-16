'use client';

import Link from 'next/link';
import React from 'react';
import { Loader2 } from 'lucide-react';
import {
    createPick,
    getFighterDisplayName,
    getFighterShortName,
    hasBoutResult,
    isAuthenticated,
    type Bout,
    type Event,
    type Pick,
} from '@/lib/api';
import { toast } from 'sonner';

type PickMethod = Pick['picked_method'];

type FastPickDraft = {
    fighterName: string | null;
    method: PickMethod | null;
    round: number | null;
};

const METHOD_OPTIONS: PickMethod[] = ['DEC', 'KO/TKO', 'SUB'];

const EMPTY_DRAFT: FastPickDraft = {
    fighterName: null,
    method: null,
    round: null,
};

interface FastPicksPanelProps {
    event: Event;
    bouts: Bout[];
    userPicks?: Pick[];
    onPicksSaved?: () => Promise<unknown> | unknown;
}

function areDraftsEqual(a: FastPickDraft, b: FastPickDraft): boolean {
    return a.fighterName === b.fighterName && a.method === b.method && a.round === b.round;
}

function isDraftComplete(draft: FastPickDraft): boolean {
    if (!draft.fighterName || !draft.method) {
        return false;
    }

    if (draft.method === 'DEC') {
        return draft.round === null;
    }

    return draft.round !== null;
}

function getBoutSlotLabel(index: number): string {
    if (index === 0) return 'MAIN EVENT';
    if (index === 1) return 'CO-MAIN';
    if (index < 5) return 'MAIN CARD';
    return 'PRELIMS';
}

function getDraftSummary(draft: FastPickDraft): string | null {
    if (!draft.fighterName || !draft.method) {
        return null;
    }

    const roundLabel = draft.method !== 'DEC' && draft.round ? ` R${draft.round}` : '';
    return `${draft.fighterName} BY ${draft.method}${roundLabel}`;
}

function isBoutLocked(event: Event, bout: Bout): boolean {
    return (
        event.status !== 'scheduled' ||
        !!event.picks_locked ||
        bout.status !== 'scheduled' ||
        !!bout.picks_locked ||
        hasBoutResult(bout.result)
    );
}

function buildSavedDrafts(bouts: Bout[], userPicks?: Pick[]): Record<number, FastPickDraft> {
    const picksByBout = new Map<number, Pick>();
    userPicks?.forEach((pick) => {
        picksByBout.set(pick.bout_id, pick);
    });

    return bouts.reduce<Record<number, FastPickDraft>>((acc, bout) => {
        const pick = picksByBout.get(bout.id);
        acc[bout.id] = pick
            ? {
                  fighterName: pick.picked_fighter_name,
                  method: pick.picked_method,
                  round: pick.picked_round ?? null,
              }
            : EMPTY_DRAFT;
        return acc;
    }, {});
}

export const FastPicksPanel = ({
    event,
    bouts,
    userPicks,
    onPicksSaved,
}: FastPicksPanelProps) => {
    const [draftOverrides, setDraftOverrides] = React.useState<Record<number, FastPickDraft>>({});
    const [rowErrors, setRowErrors] = React.useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = React.useState(false);

    const isLoggedIn = isAuthenticated();
    const savedDrafts = React.useMemo(() => buildSavedDrafts(bouts, userPicks), [bouts, userPicks]);
    const dirtyBoutIds = React.useMemo(
        () => Object.keys(draftOverrides).map((boutId) => Number(boutId)),
        [draftOverrides]
    );

    const readyCount = React.useMemo(
        () =>
            dirtyBoutIds.filter((boutId) => {
                const draft = draftOverrides[boutId] ?? savedDrafts[boutId] ?? EMPTY_DRAFT;
                return isDraftComplete(draft);
            }).length,
        [dirtyBoutIds, draftOverrides, savedDrafts]
    );

    const clearRowError = (boutId: number) => {
        setRowErrors((prev) => {
            if (!prev[boutId]) {
                return prev;
            }

            const next = { ...prev };
            delete next[boutId];
            return next;
        });
    };

    const updateDraft = (boutId: number, nextDraft: FastPickDraft) => {
        clearRowError(boutId);

        setDraftOverrides((prev) => {
            const baseline = savedDrafts[boutId] ?? EMPTY_DRAFT;

            if (areDraftsEqual(nextDraft, baseline)) {
                const next = { ...prev };
                delete next[boutId];
                return next;
            }

            return {
                ...prev,
                [boutId]: nextDraft,
            };
        });
    };

    const handlePickFighter = (boutId: number, fighterName: string) => {
        const current = draftOverrides[boutId] ?? savedDrafts[boutId] ?? EMPTY_DRAFT;
        const isClearing = current.fighterName === fighterName;

        updateDraft(boutId, {
            fighterName: isClearing ? null : fighterName,
            method: isClearing ? null : current.method,
            round: isClearing ? null : current.round,
        });
    };

    const handlePickMethod = (boutId: number, method: PickMethod) => {
        const current = draftOverrides[boutId] ?? savedDrafts[boutId] ?? EMPTY_DRAFT;
        const isClearing = current.method === method;

        updateDraft(boutId, {
            fighterName: current.fighterName,
            method: isClearing ? null : method,
            round: isClearing || method === 'DEC' ? null : current.round,
        });
    };

    const handlePickRound = (boutId: number, roundValue: string) => {
        const current = draftOverrides[boutId] ?? savedDrafts[boutId] ?? EMPTY_DRAFT;
        updateDraft(boutId, {
            fighterName: current.fighterName,
            method: current.method,
            round: roundValue ? Number(roundValue) : null,
        });
    };

    const handleResetChanges = () => {
        setDraftOverrides({});
        setRowErrors({});
    };

    const handleSubmit = async (eventForm: React.FormEvent<HTMLFormElement>) => {
        eventForm.preventDefault();

        if (!isLoggedIn) {
            toast.error('Sign in to save fast picks.');
            return;
        }

        if (dirtyBoutIds.length === 0) {
            toast.message('No fast pick changes to save.');
            return;
        }

        const validationErrors: Record<number, string> = {};

        dirtyBoutIds.forEach((boutId) => {
            const bout = bouts.find((candidate) => candidate.id === boutId);
            const draft = draftOverrides[boutId] ?? savedDrafts[boutId] ?? EMPTY_DRAFT;

            if (!bout) {
                validationErrors[boutId] = 'Fight not found.';
                return;
            }

            if (isBoutLocked(event, bout)) {
                validationErrors[boutId] = 'Picks are locked for this fight.';
                return;
            }

            if (!draft.fighterName) {
                validationErrors[boutId] = 'Pick a winner.';
                return;
            }

            if (!draft.method) {
                validationErrors[boutId] = 'Pick a method.';
                return;
            }

            if (draft.method !== 'DEC' && draft.round === null) {
                validationErrors[boutId] = 'Pick a round.';
                return;
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setRowErrors(validationErrors);
            toast.error('Complete every highlighted fast pick before saving.');
            return;
        }

        setIsSaving(true);

        const failedRows: Record<number, string> = {};
        const savedBoutIds: number[] = [];

        try {
            for (const boutId of dirtyBoutIds) {
                const draft = draftOverrides[boutId] ?? savedDrafts[boutId] ?? EMPTY_DRAFT;

                if (!draft.fighterName || !draft.method) {
                    continue;
                }

                try {
                    await createPick({
                        event_id: event.id,
                        bout_id: boutId,
                        picked_fighter_name: draft.fighterName,
                        picked_method: draft.method,
                        picked_round: draft.method === 'DEC' ? undefined : draft.round ?? undefined,
                    });
                    savedBoutIds.push(boutId);
                } catch (error) {
                    failedRows[boutId] = error instanceof Error ? error.message : 'Unable to save pick.';
                }
            }

            if (savedBoutIds.length > 0 && onPicksSaved) {
                await onPicksSaved();
            }

            if (savedBoutIds.length > 0) {
                setDraftOverrides((prev) => {
                    const next = { ...prev };
                    savedBoutIds.forEach((boutId) => {
                        delete next[boutId];
                    });
                    return next;
                });
            }

            setRowErrors(failedRows);

            if (Object.keys(failedRows).length === 0) {
                toast.success(`${savedBoutIds.length} fast picks saved.`);
            } else {
                toast.error(
                    `${savedBoutIds.length} saved, ${Object.keys(failedRows).length} still need attention.`
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form className="fast-picks-panel" onSubmit={handleSubmit}>
            <div className="fast-picks-panel__header">
                <div>
                    <div className="fast-picks-panel__eyebrow">FAST PICKS</div>
                    <h3 className="fast-picks-panel__title">Make the whole card from one table.</h3>
                    <p className="fast-picks-panel__copy">
                        Pick winner, method, and round without loading fighter photos or leaving the card.
                    </p>
                </div>
                <div className="fast-picks-panel__stats">
                    <div className="fast-picks-stat">
                        <span className="fast-picks-stat__value">{userPicks?.length ?? 0}</span>
                        <span className="fast-picks-stat__label">Saved</span>
                    </div>
                    <div className="fast-picks-stat">
                        <span className="fast-picks-stat__value">{dirtyBoutIds.length}</span>
                        <span className="fast-picks-stat__label">Changed</span>
                    </div>
                    <div className="fast-picks-stat">
                        <span className="fast-picks-stat__value">{readyCount}</span>
                        <span className="fast-picks-stat__label">Ready</span>
                    </div>
                </div>
            </div>

            {!isLoggedIn && (
                <div className="fast-picks-notice">
                    <span>Sign in to save picks from the Fast Picks table.</span>
                    <Link href="/auth" className="fast-picks-notice__link">
                        LOGIN
                    </Link>
                </div>
            )}

            {event.status !== 'scheduled' && (
                <div className="fast-picks-notice fast-picks-notice--muted">
                    This event is read-only because it is no longer scheduled.
                </div>
            )}

            {event.picks_locked && (
                <div className="fast-picks-notice fast-picks-notice--muted">
                    Event picks are locked by admin. Fast Picks is in read-only mode.
                </div>
            )}

            <div className="fast-picks-table-wrap">
                <table className="fast-picks-table">
                    <thead>
                        <tr>
                            <th>Fight</th>
                            <th>Red</th>
                            <th>Blue</th>
                            <th>DEC</th>
                            <th>KO/TKO</th>
                            <th>SUB</th>
                            <th>Round</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bouts.map((bout, index) => {
                            const savedDraft = savedDrafts[bout.id] ?? EMPTY_DRAFT;
                            const draft = draftOverrides[bout.id] ?? savedDraft;
                            const isDirty = Object.prototype.hasOwnProperty.call(draftOverrides, bout.id);
                            const isLocked = isBoutLocked(event, bout);
                            const rowError = rowErrors[bout.id];
                            const redName = getFighterDisplayName(bout.fighters.red);
                            const blueName = getFighterDisplayName(bout.fighters.blue);
                            const summary = getDraftSummary(draft);
                            const savedSummary = getDraftSummary(savedDraft);
                            const roundLimit = Math.min(bout.rounds_scheduled || 3, 5);

                            let statusLabel = 'OPEN';
                            if (hasBoutResult(bout.result)) {
                                statusLabel = 'RESULT';
                            } else if (isLocked) {
                                statusLabel = 'LOCKED';
                            } else if (rowError) {
                                statusLabel = 'ERROR';
                            } else if (isDirty && isDraftComplete(draft)) {
                                statusLabel = 'READY';
                            } else if (isDirty) {
                                statusLabel = 'EDITING';
                            } else if (savedSummary) {
                                statusLabel = 'SAVED';
                            }

                            return (
                                <tr
                                    key={bout.id}
                                    className={rowError ? 'fast-picks-row fast-picks-row--error' : 'fast-picks-row'}
                                >
                                    <td className="fast-picks-fight">
                                        <div className="fast-picks-fight__slot">{getBoutSlotLabel(index)}</div>
                                        <div className="fast-picks-fight__names">
                                            <span>{redName}</span>
                                            <span className="fast-picks-fight__vs">VS</span>
                                            <span>{blueName}</span>
                                        </div>
                                        <div className="fast-picks-fight__meta">
                                            {bout.weight_class} · {bout.rounds_scheduled} RDS
                                        </div>
                                        <div className="fast-picks-fight__summary">
                                            {isDirty
                                                ? summary ?? 'Draft in progress.'
                                                : savedSummary ?? 'No pick saved yet.'}
                                        </div>
                                        <Link
                                            href={`/events/${event.id}/fights/${bout.id}`}
                                            className="fast-picks-fight__link"
                                        >
                                            OPEN DETAIL
                                        </Link>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`fast-picks-option ${
                                                draft.fighterName === redName ? 'fast-picks-option--active' : ''
                                            }`}
                                            onClick={() => handlePickFighter(bout.id, redName)}
                                            disabled={isLocked || !isLoggedIn || isSaving}
                                        >
                                            {getFighterShortName(bout.fighters.red)}
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`fast-picks-option fast-picks-option--blue ${
                                                draft.fighterName === blueName ? 'fast-picks-option--active' : ''
                                            }`}
                                            onClick={() => handlePickFighter(bout.id, blueName)}
                                            disabled={isLocked || !isLoggedIn || isSaving}
                                        >
                                            {getFighterShortName(bout.fighters.blue)}
                                        </button>
                                    </td>
                                    {METHOD_OPTIONS.map((method) => (
                                        <td key={method}>
                                            <button
                                                type="button"
                                                className={`fast-picks-option fast-picks-option--method ${
                                                    draft.method === method ? 'fast-picks-option--active' : ''
                                                }`}
                                                onClick={() => handlePickMethod(bout.id, method)}
                                                disabled={
                                                    isLocked ||
                                                    !isLoggedIn ||
                                                    isSaving ||
                                                    !draft.fighterName
                                                }
                                            >
                                                {method}
                                            </button>
                                        </td>
                                    ))}
                                    <td>
                                        <select
                                            className="fast-picks-round-select"
                                            value={draft.round ?? ''}
                                            onChange={(eventSelect) =>
                                                handlePickRound(bout.id, eventSelect.target.value)
                                            }
                                            disabled={
                                                isLocked ||
                                                !isLoggedIn ||
                                                isSaving ||
                                                !draft.fighterName ||
                                                !draft.method ||
                                                draft.method === 'DEC'
                                            }
                                        >
                                            <option value="">-</option>
                                            {Array.from({ length: roundLimit }, (_, roundIndex) => roundIndex + 1).map(
                                                (round) => (
                                                    <option key={round} value={round}>
                                                        R{round}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </td>
                                    <td className="fast-picks-status-cell">
                                        <span className="fast-picks-status">{statusLabel}</span>
                                        {rowError && <span className="fast-picks-status__error">{rowError}</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="fast-picks-submitbar">
                <div className="fast-picks-submitbar__copy">
                    {dirtyBoutIds.length > 0
                        ? `${dirtyBoutIds.length} rows changed. ${readyCount} ready to save.`
                        : 'No pending Fast Picks changes.'}
                </div>
                <div className="fast-picks-submitbar__actions">
                    <button
                        type="button"
                        className="fast-picks-submitbar__btn fast-picks-submitbar__btn--ghost"
                        onClick={handleResetChanges}
                        disabled={dirtyBoutIds.length === 0 || isSaving}
                    >
                        RESET CHANGES
                    </button>
                    <button
                        type="submit"
                        className="fast-picks-submitbar__btn"
                        disabled={!isLoggedIn || dirtyBoutIds.length === 0 || isSaving}
                    >
                        {isSaving ? (
                            <span className="fast-picks-submitbar__saving">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                SAVING FAST PICKS
                            </span>
                        ) : (
                            'SAVE FAST PICKS'
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};
