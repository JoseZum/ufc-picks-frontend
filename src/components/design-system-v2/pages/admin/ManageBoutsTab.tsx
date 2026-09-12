'use client';

import React, { useState } from 'react';
import { useEvents, useEventBouts } from '@/lib/hooks';
import {
    cancelBout,
    updateBoutDetails,
    getFighterDisplayName,
    type Bout,
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function ManageBoutsTab() {
    const queryClient = useQueryClient();
    const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 50 });
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const { data: bouts, isLoading: boutsLoading, refetch } = useEventBouts(selectedEventId || 0);
    const [expandedBout, setExpandedBout] = useState<number | null>(null);

    if (eventsLoading) {
        return <div className="admin-section-title">Loading events...</div>;
    }

    const allEvents = eventsData?.events || [];
    const events = [...allEvents].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Callback compartido para refrescar datos tras guardar/eliminar
    const handleSuccess = () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['myPicks'] });
        queryClient.invalidateQueries({ queryKey: ['allMyPicks'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    };

    return (
        <div className="admin-tab-content admin-tab-content--active">
            <h2 className="admin-section-title">MANAGE BOUTS</h2>

            <div className="admin-event-selector">
                <label className="admin-event-selector__label">SELECT EVENT</label>
                <select
                    className="admin-form-select admin-event-selector__select"
                    value={selectedEventId || ''}
                    onChange={(e) => {
                        setSelectedEventId(parseInt(e.target.value));
                        setExpandedBout(null);
                    }}
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
                    {boutsLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading bouts...</div>
                    ) : bouts && bouts.length > 0 ? (
                        bouts.map((bout) => (
                            <BoutManageCard
                                key={bout.id}
                                bout={bout}
                                expanded={expandedBout === bout.id}
                                onToggle={() => setExpandedBout(expandedBout === bout.id ? null : bout.id)}
                                onSuccess={handleSuccess}
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

// Tarjeta individual para editar/eliminar una pelea
function BoutManageCard({
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
    // Campos del bout (pre-populados)
    const [roundsScheduled, setRoundsScheduled] = useState(String(bout.rounds_scheduled || 3));
    const [weightClass, setWeightClass] = useState(bout.weight_class || '');
    const [isTitleFight, setIsTitleFight] = useState(bout.is_title_fight || false);
    const [isBmfTitleFight, setIsBmfTitleFight] = useState(bout.is_bmf_title_fight || false);

    // Campos de card_slots (no disponibles en el objeto bout, se llenan manualmente)
    const [cardSection, setCardSection] = useState('');
    const [orderOverall, setOrderOverall] = useState('');
    const [orderSection, setOrderSection] = useState('');
    const [isMainEvent, setIsMainEvent] = useState(false);
    const [isCoMain, setIsCoMain] = useState(false);

    const [saving, setSaving] = useState(false);

    const redFighter = getFighterDisplayName(bout.fighters.red);
    const blueFighter = getFighterDisplayName(bout.fighters.blue);

    // Guarda solo los campos que cambiaron respecto a los valores originales
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: Record<string, any> = {};

            // Campos del bout
            if (parseInt(roundsScheduled) !== bout.rounds_scheduled) {
                payload.rounds_scheduled = parseInt(roundsScheduled);
            }
            if (weightClass !== (bout.weight_class || '')) {
                payload.weight_class = weightClass;
            }
            if (isTitleFight !== (bout.is_title_fight || false)) {
                payload.is_title_fight = isTitleFight;
            }
            if (isBmfTitleFight !== (bout.is_bmf_title_fight || false)) {
                payload.is_bmf_title_fight = isBmfTitleFight;
            }

            // Campos de card_slots (se envian si tienen valor)
            if (cardSection) payload.card_section = cardSection;
            if (orderOverall) payload.order_overall = parseInt(orderOverall);
            if (orderSection) payload.order_section = parseInt(orderSection);
            payload.is_main_event = isMainEvent;
            payload.is_co_main = isCoMain;

            if (Object.keys(payload).length === 0) {
                alert('No hay cambios para guardar');
                setSaving(false);
                return;
            }

            const result = await updateBoutDetails(bout.id, payload);
            alert(`✅ Pelea actualizada. Campos: ${result.updated_fields?.join(', ') || 'ninguno'}`);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('❌ Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    // Saca la pelea de la card y borra todos sus picks asociados
    const handleCancel = async () => {
        if (!window.confirm('¿Cancelar esta pelea? Saldrá de la cartelera y se borrarán todos los picks asociados.')) return;

        setSaving(true);
        try {
            const result = await cancelBout(bout.id);
            alert(`✅ Pelea cancelada. ${result.picks_deleted || 0} picks borrados, ${result.users_affected || 0} usuarios afectados.`);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('❌ Error al cancelar pelea');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`bout-result-card ${expanded ? 'bout-result-card--expanded' : ''}`}>
            <div className="bout-result-card__header" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <div className="bout-result-card__fighter bout-result-card__fighter--red">
                    <div className="bout-result-card__fighter-info">
                        <div className="bout-result-card__fighter-name">{redFighter.toUpperCase()}</div>
                        <div className="bout-result-card__fighter-record">RED CORNER</div>
                    </div>
                </div>
                <div className="bout-result-card__vs">VS</div>
                <div className="bout-result-card__fighter bout-result-card__fighter--blue">
                    <div className="bout-result-card__fighter-info">
                        <div className="bout-result-card__fighter-name">{blueFighter.toUpperCase()}</div>
                        <div className="bout-result-card__fighter-record">BLUE CORNER</div>
                    </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#999', marginLeft: 'auto', marginRight: '0.5rem' }}>
                    {bout.weight_class}
                </span>
                <span className="bout-result-card__toggle">{expanded ? '▲' : '▼'}</span>
            </div>

            {expanded && (
                <div className="bout-result-card__body">
                    <div className="bout-result-card__meta">
                        <div className="bout-result-card__meta-item">WEIGHT: <span>{bout.weight_class}</span></div>
                        <div className="bout-result-card__meta-item">ROUNDS: <span>{bout.rounds_scheduled}</span></div>
                        <div className="bout-result-card__meta-item">TITLE: <span>{bout.is_title_fight ? 'YES' : 'NO'}</span></div>
                        <div className="bout-result-card__meta-item">BMF: <span>{bout.is_bmf_title_fight ? 'YES' : 'NO'}</span></div>
                        <div className="bout-result-card__meta-item">STATUS: <span>{bout.status?.toUpperCase()}</span></div>
                    </div>

                    {/* Formulario de edicion */}
                    <div className="admin-form-grid" style={{ marginTop: '1rem' }}>
                        <div className="admin-form-group">
                            <label className="admin-form-label">ROUNDS SCHEDULED</label>
                            <select
                                className="admin-form-select"
                                value={roundsScheduled}
                                onChange={(e) => setRoundsScheduled(e.target.value)}
                            >
                                <option value="3">3</option>
                                <option value="5">5</option>
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">WEIGHT CLASS</label>
                            <input
                                type="text"
                                className="admin-form-input"
                                value={weightClass}
                                onChange={(e) => setWeightClass(e.target.value)}
                                placeholder="Ej: Lightweight"
                            />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">CARD SECTION</label>
                            <select
                                className="admin-form-select"
                                value={cardSection}
                                onChange={(e) => setCardSection(e.target.value)}
                            >
                                <option value="">-- Select --</option>
                                <option value="main">Main</option>
                                <option value="prelim">Prelim</option>
                                <option value="early_prelim">Early Prelim</option>
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">ORDER OVERALL</label>
                            <input
                                type="number"
                                className="admin-form-input"
                                value={orderOverall}
                                onChange={(e) => setOrderOverall(e.target.value)}
                                placeholder="1"
                            />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">ORDER IN SECTION</label>
                            <input
                                type="number"
                                className="admin-form-input"
                                value={orderSection}
                                onChange={(e) => setOrderSection(e.target.value)}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isTitleFight}
                                onChange={(e) => setIsTitleFight(e.target.checked)}
                            />
                            TITLE FIGHT
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isBmfTitleFight}
                                onChange={(e) => setIsBmfTitleFight(e.target.checked)}
                            />
                            BMF TITLE FIGHT
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isMainEvent}
                                onChange={(e) => setIsMainEvent(e.target.checked)}
                            />
                            MAIN EVENT
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isCoMain}
                                onChange={(e) => setIsCoMain(e.target.checked)}
                            />
                            CO-MAIN EVENT
                        </label>
                    </div>

                    {/* Botones de accion */}
                    <div className="admin-btn-group" style={{ marginTop: '1.5rem' }}>
                        <button
                            className="admin-btn admin-btn--danger"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            {saving ? 'CANCELLING...' : 'CANCEL BOUT'}
                        </button>
                        <button
                            className="admin-btn admin-btn--primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
