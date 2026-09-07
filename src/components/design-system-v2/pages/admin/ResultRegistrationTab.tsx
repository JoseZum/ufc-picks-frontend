'use client';

import React, { useState } from 'react';
import { useEvents, useEventBouts } from '@/lib/hooks';
import {
    deleteBoutResult,
    getBoutResultLabel,
    updateBoutResult,
    getFighterDisplayName,
    getFighterShortName,
    type Bout,
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function ResultRegistrationTab() {
    const queryClient = useQueryClient();
    const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 50 });
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const { data: bouts, isLoading: boutsLoading, refetch } = useEventBouts(selectedEventId || 0);
    const [expandedBout, setExpandedBout] = useState<number | null>(null);

    if (eventsLoading) {
        return <div className="admin-section-title">Loading events...</div>;
    }

    const allEvents = eventsData?.events || [];
    // Sort: show completed first, then upcoming
    const events = [...allEvents].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
        <div className="admin-tab-content admin-tab-content--active">
            <h2 className="admin-section-title">UPDATE RESULTS</h2>

            <div className="admin-event-selector">
                <label className="admin-event-selector__label">SELECT EVENT</label>
                <select
                    className="admin-form-select admin-event-selector__select"
                    value={selectedEventId || ''}
                    onChange={(e) => setSelectedEventId(parseInt(e.target.value))}
                >
                    <option value="">-- Select an event --</option>
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>
                            {event.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <>
                    <div className="admin-alert admin-alert--warning">
                        <span className="admin-alert__icon">⚠</span>
                        <span>WARNING: Updating results will automatically trigger points calculation. This action cannot be easily undone.</span>
                    </div>

                    {boutsLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading bouts...</div>
                    ) : bouts && bouts.length > 0 ? (
                        bouts.map((bout) => (
                            <BoutResultCard
                                key={bout.id}
                                bout={bout}
                                expanded={expandedBout === bout.id}
                                onToggle={() => setExpandedBout(expandedBout === bout.id ? null : bout.id)}
                                onSuccess={() => {
                                    refetch();
                                    queryClient.invalidateQueries({ queryKey: ['myPicks'] });
                                    queryClient.invalidateQueries({ queryKey: ['allMyPicks'] });
                                    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
                                }}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No bouts found for this event</div>
                    )}
                </>
            )}
        </div>
    );
}

function BoutResultCard({
    bout,
    expanded,
    onToggle,
    onSuccess,
}: {
    bout: Bout;
    expanded: boolean;
    onToggle: () => void;
    onSuccess: () => void;
}) {
    const [winner, setWinner] = useState<'red' | 'blue' | 'draw' | 'nc' | ''>('');
    const [method, setMethod] = useState('');
    const [round, setRound] = useState('');
    const [time, setTime] = useState('');
    const [saving, setSaving] = useState(false);

    const hasResult = bout.result && bout.status === 'completed';
    const redFighter = getFighterDisplayName(bout.fighters.red);
    const blueFighter = getFighterDisplayName(bout.fighters.blue);

    const handleSubmit = async () => {
        if (!winner || !method) {
            alert('Please select winner and method');
            return;
        }

        setSaving(true);
        try {
            const result = await updateBoutResult(bout.id, {
                winner,
                method,
                round: round ? parseInt(round) : undefined,
                time: time || undefined,
            });
            alert(`✅ Result saved! ${result.points_assigned?.picks_processed || 0} picks processed`);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('❌ Error saving result');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this result and revert all points?')) return;

        setSaving(true);
        try {
            await deleteBoutResult(bout.id);
            alert('✅ Result deleted and points reverted');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('❌ Error deleting result');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`bout-result-card ${hasResult ? 'bout-result-card--has-result' : ''} ${expanded ? 'bout-result-card--expanded' : ''}`}>
            <div className="bout-result-card__header" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <div className="bout-result-card__fighter bout-result-card__fighter--red">
                    <div className="bout-result-card__fighter-photo">★</div>
                    <div className="bout-result-card__fighter-info">
                        <div className="bout-result-card__fighter-name">{getFighterShortName(bout.fighters.red)}</div>
                        <div className="bout-result-card__fighter-record">RED CORNER</div>
                    </div>
                </div>
                <div className="bout-result-card__vs">VS</div>
                <div className="bout-result-card__fighter bout-result-card__fighter--blue">
                    <div className="bout-result-card__fighter-photo">♥</div>
                    <div className="bout-result-card__fighter-info">
                        <div className="bout-result-card__fighter-name">{getFighterShortName(bout.fighters.blue)}</div>
                        <div className="bout-result-card__fighter-record">BLUE CORNER</div>
                    </div>
                </div>
                {hasResult && (
                    <span className="bout-result-card__result-badge">
                        {getBoutResultLabel(bout.result)}
                    </span>
                )}
                <span className="bout-result-card__toggle">{expanded ? '▲' : '▼'}</span>
            </div>

            {expanded && (
                <div className="bout-result-card__body">
                    <div className="bout-result-card__meta">
                        <div className="bout-result-card__meta-item">BOUT: <span>{bout.weight_class}</span></div>
                        <div className="bout-result-card__meta-item">ROUNDS: <span>{bout.rounds_scheduled}</span></div>
                        <div className="bout-result-card__meta-item">TITLE: <span>{bout.is_title_fight ? 'YES' : 'NO'}</span></div>
                    </div>

                    {hasResult && (
                        <div className="admin-alert admin-alert--success" style={{ marginBottom: '1rem' }}>
                            <span>✓ Result recorded: {getBoutResultLabel(bout.result)} by {bout.result?.method}</span>
                            <button className="admin-btn admin-btn--secondary" onClick={handleDelete} disabled={saving} style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                {saving ? 'DELETING...' : 'DELETE'}
                            </button>
                        </div>
                    )}

                    <label className="admin-form-label" style={{ marginBottom: '1rem', display: 'block' }}>WINNER SELECTION</label>
                    <div className="winner-selection">
                        <div
                            className={`winner-option winner-option--red ${winner === 'red' ? 'winner-option--selected' : ''}`}
                            onClick={() => setWinner('red')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="winner-option__name">{redFighter.toUpperCase()}</div>
                            <div className="winner-option__label">RED CORNER</div>
                        </div>
                        <div
                            className={`winner-option winner-option--blue ${winner === 'blue' ? 'winner-option--selected' : ''}`}
                            onClick={() => setWinner('blue')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="winner-option__name">{blueFighter.toUpperCase()}</div>
                            <div className="winner-option__label">BLUE CORNER</div>
                        </div>
                        <div
                            className={`winner-option winner-option--draw ${winner === 'draw' ? 'winner-option--selected' : ''}`}
                            onClick={() => setWinner('draw')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="winner-option__name">DRAW</div>
                            <div className="winner-option__label">0 POINTS FOR EVERYONE</div>
                        </div>
                        <div
                            className={`winner-option winner-option--nc ${winner === 'nc' ? 'winner-option--selected' : ''}`}
                            onClick={() => setWinner('nc')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="winner-option__name">NO CONTEST</div>
                            <div className="winner-option__label">NO WINNER RECORDED</div>
                        </div>
                    </div>

                    <label className="admin-form-label" style={{ marginBottom: '1rem', marginTop: '1.5rem', display: 'block' }}>METHOD OF VICTORY</label>
                    <div className="admin-result-form">
                        <div className="admin-form-group">
                            <label className="admin-form-label">METHOD</label>
                            <select className="admin-form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                                <option value="">-- Select --</option>
                                <option value="KO/TKO">KO/TKO</option>
                                <option value="SUB">SUBMISSION</option>
                                <option value="DEC">DECISION</option>
                                <option value="DQ">DISQUALIFICATION</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">ROUND</label>
                            <select className="admin-form-select" value={round} onChange={(e) => setRound(e.target.value)}>
                                <option value="">--</option>
                                {Array.from({ length: bout.rounds_scheduled }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">TIME</label>
                            <input
                                type="text"
                                className="admin-form-input"
                                placeholder="MM:SS"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="admin-btn-group">
                        <button
                            className="admin-btn admin-btn--secondary"
                            onClick={() => {
                                setWinner('');
                                setMethod('');
                                setRound('');
                                setTime('');
                            }}
                        >
                            RESET
                        </button>
                        <button
                            className="admin-btn admin-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving || !winner || !method || hasResult}
                        >
                            {saving ? 'SAVING...' : 'CONFIRM RESULT'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== EVENT ART UPLOAD TAB =====
