'use client';

import React, { useState } from 'react';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { useEvents, useEventBouts, useCurrentUser } from '@/lib/hooks';
import { getAuthToken, Event, Bout } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export const AdminPageV2 = () => {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'timing' | 'results' | 'uploads'>('timing');

    // Redirect if not admin
    if (!userLoading && (!user || !user.is_admin)) {
        router.push('/');
        return null;
    }

    if (userLoading || !user) {
        return (
            <V2Layout>
                <NavBarV2 activePage="events" />
                <div className="main" style={{ paddingTop: '90px', textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner"></div>
                </div>
            </V2Layout>
        );
    }

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <div className="main" style={{ paddingTop: '90px', maxWidth: '1200px', paddingBottom: '4rem' }}>
                <header className="admin-header">
                    <div className="admin-header__title">
                        <div className="admin-header__icon">⚙</div>
                        <div className="admin-header__text">
                            <h1>ADMIN PANEL</h1>
                            <p>Event Management // Result Registration // Image Uploads</p>
                        </div>
                    </div>
                    <div className="admin-header__badge">ADMINISTRATOR</div>
                </header>

                {/* TAB NAVIGATION */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'timing' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('timing')}
                    >
                        <span className="admin-tab__icon">📅</span>
                        MANAGE EVENTS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'results' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('results')}
                    >
                        <span className="admin-tab__icon">🏆</span>
                        REGISTER RESULTS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'uploads' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('uploads')}
                    >
                        <span className="admin-tab__icon">📷</span>
                        EVENT ART
                    </button>
                </div>

                {/* TAB 1: EVENT TIMING MANAGER */}
                {activeTab === 'timing' && <EventTimingTab />}

                {/* TAB 2: RESULT REGISTRATION */}
                {activeTab === 'results' && <ResultRegistrationTab />}

                {/* TAB 3: EVENT ART UPLOADS */}
                {activeTab === 'uploads' && <EventArtTab />}
            </div>
        </V2Layout>
    );
};

// ===== EVENT TIMING TAB =====
function EventTimingTab() {
    const { data: eventsData, isLoading, refetch } = useEvents({ limit: 50 });
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [saving, setSaving] = useState<number | null>(null);
    const [locking, setLocking] = useState<number | null>(null);
    const [eventFilter, setEventFilter] = useState<'upcoming' | 'completed'>('upcoming');

    const handleLockPicks = async (eventId: number) => {
        setLocking(eventId);
        try {
            const token = getAuthToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/lock-picks`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to lock picks');
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
            const token = getAuthToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/unlock-picks`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to unlock picks');
            alert('✅ Picks unlocked successfully');
            refetch();
        } catch (error) {
            console.error(error);
            alert('❌ Error unlocking picks');
        } finally {
            setLocking(null);
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
                    saving={saving === event.id}
                    locking={locking === event.id}
                    onSave={async (eventDate, picksLockDate) => {
                        setSaving(event.id);
                        try {
                            const token = getAuthToken();
                            const response = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${event.id}/timing`,
                                {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                        event_date: eventDate || undefined,
                                        picks_lock_date: picksLockDate || undefined,
                                    }),
                                }
                            );

                            if (!response.ok) throw new Error('Failed to update timing');
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
    onSave,
    saving,
    locking,
}: {
    event: Event;
    expanded: boolean;
    onToggle: () => void;
    onLock: () => void;
    onUnlock: () => void;
    onSave: (eventDate: string, picksLockDate: string) => void;
    saving: boolean;
    locking: boolean;
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
                    <p>{formatDate(event.date)} // {event.location?.venue || 'TBA'}</p>
                </div>
                <span className={`event-timing-card__status ${event.picks_locked ? 'event-timing-card__status--locked' : 'event-timing-card__status--open'}`}>
                    {event.picks_locked ? 'LOCKED' : 'OPEN'}
                </span>
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
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== RESULT REGISTRATION TAB =====
function ResultRegistrationTab() {
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
    const [winner, setWinner] = useState('');
    const [method, setMethod] = useState('');
    const [round, setRound] = useState('');
    const [time, setTime] = useState('');
    const [saving, setSaving] = useState(false);

    const hasResult = bout.result && bout.status === 'completed';
    const redFighter = bout.fighters.red?.fighter_name || 'TBD';
    const blueFighter = bout.fighters.blue?.fighter_name || 'TBD';

    const handleSubmit = async () => {
        if (!winner || !method) {
            alert('Please select winner and method');
            return;
        }

        setSaving(true);
        try {
            const token = getAuthToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/bouts/${bout.id}/result`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        winner,
                        method,
                        round: round ? parseInt(round) : undefined,
                        time: time || undefined,
                    }),
                }
            );

            if (!response.ok) throw new Error('Failed to save result');
            const result = await response.json();
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
            const token = getAuthToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/bouts/${bout.id}/result`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to delete result');
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
                        <div className="bout-result-card__fighter-name">{redFighter.split(' ').pop()?.toUpperCase()}</div>
                        <div className="bout-result-card__fighter-record">RED CORNER</div>
                    </div>
                </div>
                <div className="bout-result-card__vs">VS</div>
                <div className="bout-result-card__fighter bout-result-card__fighter--blue">
                    <div className="bout-result-card__fighter-photo">♥</div>
                    <div className="bout-result-card__fighter-info">
                        <div className="bout-result-card__fighter-name">{blueFighter.split(' ').pop()?.toUpperCase()}</div>
                        <div className="bout-result-card__fighter-record">BLUE CORNER</div>
                    </div>
                </div>
                {hasResult && (
                    <span className="bout-result-card__result-badge">
                        {bout.result?.winner === 'red' ? 'RED WIN' : bout.result?.winner === 'blue' ? 'BLUE WIN' : 'DRAW'}
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
                            <span>✓ Result recorded: {bout.result?.winner?.toUpperCase() || 'DRAW'} by {bout.result?.method}</span>
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
function EventArtTab() {
    const { data: eventsData, isLoading, refetch } = useEvents({ limit: 50 });
    const [uploading, setUploading] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [eventFilter, setEventFilter] = useState<'upcoming' | 'completed'>('upcoming');

    const handleUpload = async (eventId: number, file: File) => {
        setUploading(eventId);
        try {
            const token = getAuthToken();
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/event-art`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Upload failed');
            }

            alert('✅ Event art uploaded successfully');
            refetch();
        } catch (error: any) {
            console.error(error);
            alert(`❌ ${error.message}`);
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (eventId: number) => {
        if (!confirm('Delete event art for this event?')) return;

        setDeleting(eventId);
        try {
            const token = getAuthToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/event-art`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Delete failed');
            alert('✅ Event art deleted');
            refetch();
        } catch (error) {
            console.error(error);
            alert('❌ Error deleting event art');
        } finally {
            setDeleting(null);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 className="admin-section-title">EVENT ART UPLOADS</h2>
                    <p style={{ color: '#999', fontSize: '0.95rem' }}>
                        Upload custom event art images. These will be displayed as hero backgrounds on event pages. Supported formats: AVIF, PNG, JPG, WEBP.
                    </p>
                </div>
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
                <div key={event.id} className="event-art-card">
                    <div className="event-art-card__header">
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{event.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                                {new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </p>
                        </div>
                        {event.event_art_url && (
                            <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600 }}>✓ HAS ART</span>
                        )}
                    </div>
                    <div className="event-art-card__body">
                        <input
                            type="file"
                            accept="image/avif,image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(event.id, file);
                            }}
                            disabled={uploading === event.id || deleting === event.id}
                            style={{
                                padding: '0.75rem',
                                border: '2px solid #333',
                                borderRadius: '4px',
                                backgroundColor: '#1a1a1a',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        />
                        {event.event_art_url && (
                            <button
                                className="admin-btn admin-btn--secondary"
                                onClick={() => handleDelete(event.id)}
                                disabled={deleting === event.id || uploading === event.id}
                                style={{ marginLeft: 'auto' }}
                            >
                                {deleting === event.id ? 'DELETING...' : 'DELETE ART'}
                            </button>
                        )}
                        {uploading === event.id && <span style={{ color: '#999', fontSize: '0.9rem' }}>Uploading...</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
