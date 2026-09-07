'use client';

import React, { useState } from 'react';
import { useEvents } from '@/lib/hooks';
import {
    lockEventPicks,
    unlockEventPicks,
    updateEventTiming,
    completeEvent,
    getEventDateTime,
    type Event,
} from '@/lib/api';

// ===== EVENT TIMING TAB =====
export function EventTimingTab() {
    const { data: eventsData, isLoading, refetch } = useEvents({ limit: 50 });
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [saving, setSaving] = useState<number | null>(null);
    const [locking, setLocking] = useState<number | null>(null);
    const [completing, setCompleting] = useState<number | null>(null);
    const [eventFilter, setEventFilter] = useState<'upcoming' | 'completed'>('upcoming');

    const handleLockPicks = async (eventId: number) => {
        setLocking(eventId);
        try {
            await lockEventPicks(eventId);
            alert('✅ Picks locked successfully');
            refetch();
        } catch (error) {
            console.error(error);
            alert('❌ Error locking picks');
        } finally {
            setLocking(null);
        }
    };

    const handleUnlockPicks = async (eventId: number) => {
        setLocking(eventId);
        try {
            await unlockEventPicks(eventId);
            alert('✅ Picks unlocked successfully');
            refetch();
        } catch (error) {
            console.error(error);
            alert('❌ Error unlocking picks');
        } finally {
            setLocking(null);
        }
    };

    const handleCompleteEvent = async (eventId: number) => {
        if (!confirm('¿Marcar este evento como COMPLETED? Desaparecerá del panel de upcoming.')) return;
        setCompleting(eventId);
        try {
            await completeEvent(eventId);
            alert('✅ Evento marcado como completado');
            refetch();
        } catch (error) {
            console.error(error);
            alert('❌ Error al completar el evento');
        } finally {
            setCompleting(null);
        }
    };

    if (isLoading) {
        return <div className="admin-section-title">Loading events...</div>;
    }

    const allEvents = eventsData?.events || [];
    const upcomingEvents = allEvents.filter(e => e.status === 'scheduled');
    const completedEvents = allEvents.filter(e => e.status === 'completed' || e.status === 'cancelled');
    const events = eventFilter === 'upcoming' ? upcomingEvents : completedEvents;

    return (
        <div className="admin-tab-content admin-tab-content--active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="admin-section-title">{eventFilter === 'upcoming' ? 'UPCOMING EVENTS' : 'COMPLETED EVENTS'}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`filter-btn ${eventFilter === 'upcoming' ? 'filter-btn--active' : ''}`}
                        onClick={() => setEventFilter('upcoming')}
                    >
                        UPCOMING
                    </button>
                    <button
                        className={`filter-btn ${eventFilter === 'completed' ? 'filter-btn--active' : ''}`}
                        onClick={() => setEventFilter('completed')}
                    >
                        COMPLETED
                    </button>
                </div>
            </div>

            {events.map((event) => (
                <EventTimingCard
                    key={event.id}
                    event={event}
                    expanded={expandedEvent === event.id}
                    onToggle={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    onLock={() => handleLockPicks(event.id)}
                    onUnlock={() => handleUnlockPicks(event.id)}
                    onComplete={() => handleCompleteEvent(event.id)}
                    saving={saving === event.id}
                    locking={locking === event.id}
                    completing={completing === event.id}
                    onSave={async (eventDate, picksLockDate) => {
                        setSaving(event.id);
                        try {
                            await updateEventTiming(event.id, {
                                card_start_time_utc: eventDate || undefined,
                                picks_lock_time_utc: picksLockDate || undefined,
                            });
                            alert('✅ Event timing updated');
                            refetch();
                        } catch (error) {
                            console.error(error);
                            alert('❌ Error updating timing');
                        } finally {
                            setSaving(null);
                        }
                    }}
                />
            ))}
        </div>
    );
}

function EventTimingCard({
    event,
    expanded,
    onToggle,
    onLock,
    onUnlock,
    onComplete,
    onSave,
    saving,
    locking,
    completing,
}: {
    event: Event;
    expanded: boolean;
    onToggle: () => void;
    onLock: () => void;
    onUnlock: () => void;
    onComplete: () => void;
    onSave: (eventDate: string, picksLockDate: string) => void;
    saving: boolean;
    locking: boolean;
    completing: boolean;
}) {
    const [eventDate, setEventDate] = useState('');
    const [picksLockDate, setPicksLockDate] = useState('');

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Not Set';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase();
    };

    return (
        <div className={`event-timing-card ${expanded ? 'event-timing-card--expanded' : ''}`}>
            <div className="event-timing-card__header" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <div className="event-timing-card__info">
                    <h3>{event.name}</h3>
                    <p>{formatDate(event.date)} {'//'} {event.location?.venue || 'TBA'}</p>
                </div>
                {(() => {
                    const isLive = event.status === 'scheduled' && new Date() >= getEventDateTime(event);
                    return (
                        <span className={`event-timing-card__status ${isLive ? '' : event.picks_locked ? 'event-timing-card__status--locked' : 'event-timing-card__status--open'}`}
                            style={isLive ? { background: '#dc2626', color: '#fff' } : undefined}>
                            {isLive ? 'LIVE NOW' : event.picks_locked ? 'LOCKED' : 'OPEN'}
                        </span>
                    );
                })()}
                <span className="event-timing-card__toggle">{expanded ? '▲' : '▼'}</span>
            </div>

            {expanded && (
                <div className="event-timing-card__body">
                    <div className="admin-form-grid">
                        <div className="admin-form-group">
                            <label className="admin-form-label">EVENT DATE & TIME</label>
                            <input
                                type="datetime-local"
                                className="admin-form-input"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">PICKS LOCK DATE & TIME</label>
                            <input
                                type="datetime-local"
                                className="admin-form-input"
                                value={picksLockDate}
                                onChange={(e) => setPicksLockDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="admin-btn-group">
                        {event.picks_locked ? (
                            <button
                                className="admin-btn admin-btn--secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUnlock();
                                }}
                                disabled={locking}
                            >
                                {locking ? 'UNLOCKING...' : 'UNLOCK PICKS'}
                            </button>
                        ) : (
                            <button
                                className="admin-btn admin-btn--secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLock();
                                }}
                                disabled={locking}
                            >
                                {locking ? 'LOCKING...' : 'LOCK PICKS NOW'}
                            </button>
                        )}
                        <button
                            className="admin-btn admin-btn--primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave(eventDate, picksLockDate);
                            }}
                            disabled={saving || (!eventDate && !picksLockDate)}
                        >
                            {saving ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                        {event.status === 'scheduled' && (
                            <button
                                className="admin-btn"
                                style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onComplete();
                                }}
                                disabled={completing}
                            >
                                {completing ? 'COMPLETING...' : 'MARK AS COMPLETED'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== RESULT REGISTRATION TAB =====
