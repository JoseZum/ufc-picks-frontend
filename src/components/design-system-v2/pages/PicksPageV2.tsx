'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { EventPicksSection } from '../EventPicksSection';
import { useCurrentUser, useAllMyPicks, useEvents } from '@/lib/hooks';
import { getEventPosterUrl } from '@/lib/api';
import api from '@/lib/api';
import { Loader2, Search, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const PicksPageV2 = () => {
    const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all');
    const [browseOpen, setBrowseOpen] = useState(false);
    const [browseQuery, setBrowseQuery] = useState('');
    const queryClient = useQueryClient();
    const cleanupDone = useRef(false);

    const { data: currentUser } = useCurrentUser();
    const { data: allPicks, isLoading: picksLoading } = useAllMyPicks();
    const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 50 });

    const events = eventsData?.events || [];
    const isLoading = picksLoading || eventsLoading;

    // Limpiar picks pendientes de eventos completados al entrar
    useEffect(() => {
        if (!currentUser || cleanupDone.current) return;
        cleanupDone.current = true;

        api.cleanupPendingPicks().then((res) => {
            if (res.deleted > 0) {
                queryClient.invalidateQueries({ queryKey: ['allMyPicks'] });
            }
        }).catch(() => {});
    }, [currentUser, queryClient]);

    // Agrupar picks por evento
    const picksByEvent = useMemo(() => {
        if (!allPicks || !events.length) return new Map();

        const grouped = new Map<number, Array<{ pick: any, event: any }>>();
        allPicks.forEach(pick => {
            const event = events.find(e => e.id === pick.event_id);
            const existing = grouped.get(pick.event_id) || [];
            existing.push({ pick, event });
            grouped.set(pick.event_id, existing);
        });
        return grouped;
    }, [allPicks, events]);

    // Estadísticas globales
    const stats = useMemo(() => {
        if (!allPicks) return { total: 0, correct: 0, incorrect: 0, accuracy: 0 };

        const decided = allPicks.filter(p => p.is_correct !== null);
        const correct = decided.filter(p => p.is_correct === true).length;
        const incorrect = decided.filter(p => p.is_correct === false).length;

        return {
            total: allPicks.length,
            correct,
            incorrect,
            accuracy: decided.length > 0 ? Math.round((correct / decided.length) * 100) : 0
        };
    }, [allPicks]);

    // Eventos con picks, ordenados por fecha (más reciente primero)
    const eventsWithPicks = useMemo(() => {
        return events
            .filter(e => picksByEvent.has(e.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [events, picksByEvent]);

    const pendingEvents = eventsWithPicks.filter(e => e.status === 'scheduled');
    const completedEvents = eventsWithPicks.filter(e => e.status !== 'scheduled');

    // Eventos filtrados por la búsqueda del navegador "Browse Events"
    const browseEvents = useMemo(() => {
        const q = browseQuery.trim().toLowerCase();
        if (!q) return eventsWithPicks;
        return eventsWithPicks.filter(e => e.name.toLowerCase().includes(q));
    }, [eventsWithPicks, browseQuery]);

    const selectEvent = (id: number | 'all') => {
        setSelectedEventId(id);
        setBrowseOpen(false);
        setBrowseQuery('');
    };

    const selectedEvent = selectedEventId !== 'all'
        ? events.find(e => e.id === selectedEventId)
        : null;

    return (
        <V2Layout>
            <NavBarV2 activePage="picks" />

            <div className="main">
                <header className="page-header">
                    <div>
                        <h1 className="page-header__title">MY PICKS</h1>
                        <p className="page-header__subtitle">Your Prediction History // Track Your Performance</p>
                    </div>
                </header>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : !currentUser ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Please log in to see your picks</p>
                        <a href="/auth" className="btn btn--primary">LOGIN</a>
                    </div>
                ) : (
                    <>
                        <div className="stats-overview">
                            <div className="stat-box">
                                <div className="stat-box__value">{stats.total}</div>
                                <div className="stat-box__label">TOTAL PICKS</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box__value stat-box__value--success">{stats.correct}</div>
                                <div className="stat-box__label">CORRECT</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box__value stat-box__value--error">{stats.incorrect}</div>
                                <div className="stat-box__label">INCORRECT</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box__value stat-box__value--accent">{stats.accuracy}%</div>
                                <div className="stat-box__label">ACCURACY</div>
                            </div>
                        </div>

                        {/* Barra de control: ALL EVENTS + (evento seleccionado) + BROWSE EVENTS */}
                        {eventsWithPicks.length > 0 && (
                            <div className="picks-controls">
                                <button
                                    className={`event-tab ${selectedEventId === 'all' ? 'event-tab--active' : ''}`}
                                    onClick={() => selectEvent('all')}
                                >
                                    ALL EVENTS
                                </button>

                                {selectedEvent && (
                                    <span className="picks-controls__current">
                                        {selectedEvent.name.toUpperCase()}
                                        <button
                                            className="picks-controls__clear"
                                            onClick={() => selectEvent('all')}
                                            aria-label="Clear selection"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                )}

                                <button
                                    className="picks-controls__browse"
                                    onClick={() => setBrowseOpen(true)}
                                >
                                    <Search size={14} />
                                    BROWSE EVENTS
                                </button>
                            </div>
                        )}

                        {/* Vista de un evento seleccionado o de todos */}
                        {selectedEvent ? (
                            (() => {
                                const picks = picksByEvent.get(selectedEvent.id) || [];
                                return picks.length > 0
                                    ? <EventPicksSection event={selectedEvent} picks={picks} />
                                    : null;
                            })()
                        ) : (
                            <>
                                {pendingEvents.map(event => (
                                    <EventPicksSection key={event.id} event={event} picks={picksByEvent.get(event.id) || []} />
                                ))}

                                {pendingEvents.length > 0 && completedEvents.length > 0 && (
                                    <div className="section-divider">
                                        <div className="section-divider__line"></div>
                                        <span className="section-divider__text">COMPLETED EVENTS</span>
                                        <div className="section-divider__line"></div>
                                    </div>
                                )}

                                {completedEvents.map(event => (
                                    <EventPicksSection key={event.id} event={event} picks={picksByEvent.get(event.id) || []} />
                                ))}

                                {eventsWithPicks.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                        <p>No picks made yet.</p>
                                        <a href="/events" style={{ color: 'var(--accent)', marginTop: '1rem', display: 'inline-block' }}>
                                            Browse Events &rarr;
                                        </a>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* MODAL: BROWSE EVENTS */}
            {browseOpen && (
                <div className="browse-modal" onClick={() => setBrowseOpen(false)}>
                    <div className="browse-modal__panel" onClick={(e) => e.stopPropagation()}>
                        <div className="browse-modal__header">
                            <h2 className="browse-modal__title">BROWSE EVENTS</h2>
                            <button className="browse-modal__close" onClick={() => setBrowseOpen(false)} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="browse-search">
                            <Search size={16} className="browse-search__icon" />
                            <input
                                autoFocus
                                className="browse-search__input"
                                placeholder="Search events..."
                                value={browseQuery}
                                onChange={(e) => setBrowseQuery(e.target.value)}
                            />
                        </div>

                        <div className="browse-grid">
                            {browseEvents.map(event => (
                                <button
                                    key={event.id}
                                    className={`browse-card ${event.is_bmf_title_fight ? 'event-card--bmf' : event.is_title_fight ? 'event-card--title' : ''}`}
                                    onClick={() => selectEvent(event.id)}
                                >
                                    <div
                                        className="browse-card__image"
                                        style={{
                                            backgroundImage: `url(${getEventPosterUrl(event)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {(event.is_title_fight || event.is_bmf_title_fight) && <span className="event-card__title-flag">★</span>}
                                        {event.status === 'scheduled' && <span className="browse-card__pending">PENDING</span>}
                                    </div>
                                    <div className="browse-card__name">{event.name}</div>
                                </button>
                            ))}

                            {browseEvents.length === 0 && (
                                <div className="browse-grid__empty">No events match "{browseQuery}".</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <footer className="footer">
                <div className="footer__grid">
                    <div className="footer__block">
                        <div className="footer__label">SYSTEM</div>
                        <div className="footer__text">UFC PICKS v2.0</div>
                    </div>
                </div>
            </footer>
            <MobileNav activePage="picks" />
        </V2Layout>
    );
};
