'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useCurrentUser, useAllMyPicks, useEvents, useEventBouts } from '@/lib/hooks';
import { getFighterImageUrl } from '@/lib/api';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { formatEventDate } from '@/lib/dateUtils';
import { useQueryClient } from '@tanstack/react-query';

// Calcula puntos basado en el pick y el resultado de la pelea
function computePoints(pick: any, bout: any): number {
    if (pick.is_correct !== true || !bout?.result) return 0;

    let points = 1; // Acertó el ganador

    const normalize = (m: string | undefined) => {
        if (!m) return "";
        const u = m.toUpperCase();
        if (["KO", "TKO", "KO/TKO"].includes(u)) return "KO/TKO";
        if (["SUB", "SUBMISSION"].includes(u)) return "SUB";
        if (["DEC", "DECISION"].includes(u)) return "DEC";
        return u;
    };

    const pickMethod = normalize(pick.picked_method);
    const resultMethod = normalize(bout.result.method);

    if (pickMethod && resultMethod && pickMethod === resultMethod) {
        points += 1;
        if (pickMethod !== "DEC" && pick.picked_round && bout.result.round) {
            if (pick.picked_round === bout.result.round) {
                points += 1;
            }
        }
    }

    return points;
}

export const PicksPageV2 = () => {
    const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all');
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

    // Group picks by event
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

    // Calculate stats
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

    // Events with picks, sorted by date
    const eventsWithPicks = useMemo(() => {
        return events
            .filter(e => picksByEvent.has(e.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [events, picksByEvent]);

    const pendingEvents = eventsWithPicks.filter(e => e.status === 'scheduled');
    const completedEvents = eventsWithPicks.filter(e => e.status !== 'scheduled');

    // Component to render picks for an event (fetches bouts for that event)
    const EventPicksSection = ({ event, picks }: { event: any, picks: Array<{ pick: any, event: any }> }) => {
        const { data: bouts } = useEventBouts(event.id);
        
        const picksWithBouts = picks.map(p => ({
            ...p,
            bout: bouts?.find(b => b.id === p.pick.bout_id)
        }));

        const eventPicks = picksWithBouts.filter(p => p.bout);
        const decidedPicks = eventPicks.filter(p => p.pick.is_correct !== null);
        const correctPicks = decidedPicks.filter(p => p.pick.is_correct === true).length;
        const eventAccuracy = decidedPicks.length > 0 
            ? Math.round((correctPicks / decidedPicks.length) * 100) 
            : null;
        const isPending = event.status === 'scheduled';

        return (
            <div className="picks-event">
                <div className="picks-event__header">
                    <div>
                        <h2 className="picks-event__title">{event.name}</h2>
                        <p className="picks-event__date">{formatEventDate(event)} {isPending && '// PENDING'}</p>
                    </div>
                    <div className="picks-event__score">
                        <div className="picks-event__score-value">
                            {isPending ? `${eventPicks.length}` : `${correctPicks}/${decidedPicks.length}`}
                        </div>
                        <div className="picks-event__score-label">
                            {isPending ? 'PICKS MADE' : eventAccuracy !== null ? `${eventAccuracy}% ACCURACY` : 'NO RESULTS'}
                        </div>
                    </div>
                </div>

                {eventPicks.map(({ pick, bout }) => {
                    if (!bout) return null;
                    
                    const isPicked1 = pick.predicted_winner === bout.fighters.red.fighter_name;
                    const isPicked2 = pick.predicted_winner === bout.fighters.blue.fighter_name;
                    const isCorrect = pick.is_correct === true;
                    const isIncorrect = pick.is_correct === false;
                    const isPendingPick = pick.is_correct === null;
                    
                    const pts = isCorrect && bout ? computePoints(pick, bout) : 0;
                    const isPerfect = isCorrect && pts === 3;

                    const rowClass = isPendingPick
                        ? 'pick-row pick-row--pending'
                        : isPerfect
                            ? 'pick-row pick-row--perfect'
                            : isCorrect
                                ? 'pick-row pick-row--correct'
                                : 'pick-row pick-row--incorrect';

                    return (
                        <div key={pick.id} className={rowClass}>
                            <div className={`pick-row__fighter pick-row__fighter--red ${isPicked1 ? 'pick-row__fighter--selected' : ''}`}>
                                <div
                                    className="pick-row__photo"
                                    style={{
                                        backgroundImage: `url(${getFighterImageUrl(bout.fighters.red)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                />
                                <div className="pick-row__info">
                                    <div className="pick-row__name">{bout.fighters.red.fighter_name?.toUpperCase()}</div>
                                    <div className="pick-row__record">
                                        {bout.fighters.red.record_at_fight ? 
                                            `${bout.fighters.red.record_at_fight.wins}-${bout.fighters.red.record_at_fight.losses}-${bout.fighters.red.record_at_fight.draws}` 
                                            : '-'}
                                    </div>
                                    {isPicked1 && <div className="pick-row__your-pick">YOUR PICK</div>}
                                </div>
                            </div>
                            <div className="pick-row__vs">VS</div>
                            <div className={`pick-row__fighter pick-row__fighter--blue ${isPicked2 ? 'pick-row__fighter--selected' : ''}`}>
                                <div
                                    className="pick-row__photo"
                                    style={{
                                        backgroundImage: `url(${getFighterImageUrl(bout.fighters.blue)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                />
                                <div className="pick-row__info">
                                    <div className="pick-row__name">{bout.fighters.blue.fighter_name?.toUpperCase()}</div>
                                    <div className="pick-row__record">
                                        {bout.fighters.blue.record_at_fight ? 
                                            `${bout.fighters.blue.record_at_fight.wins}-${bout.fighters.blue.record_at_fight.losses}-${bout.fighters.blue.record_at_fight.draws}` 
                                            : '-'}
                                    </div>
                                    {isPicked2 && <div className="pick-row__your-pick">YOUR PICK</div>}
                                </div>
                            </div>
                            <div className="pick-row__result">
                                {isPendingPick && (
                                    <span className="pick-row__result-badge pick-row__result-badge--pending">PENDING</span>
                                )}
                                {isCorrect && (
                                    <>
                                        <span className={`pick-row__result-badge ${isPerfect ? 'pick-row__result-badge--perfect' : 'pick-row__result-badge--correct'}`}>
                                            {isPerfect ? 'PERFECT' : 'CORRECT'}
                                        </span>
                                        <span className={`pick-row__points ${isPerfect ? 'pick-row__points--perfect' : 'pick-row__points--positive'}`}>+{pts}</span>
                                    </>
                                )}
                                {isIncorrect && (
                                    <>
                                        <span className="pick-row__result-badge pick-row__result-badge--incorrect">WRONG</span>
                                        <span className="pick-row__points pick-row__points--negative">0</span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

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

                        {/* Event Tabs */}
                        {eventsWithPicks.length > 0 && (
                            <div className="event-tabs">
                                <button 
                                    className={`event-tab ${selectedEventId === 'all' ? 'event-tab--active' : ''}`}
                                    onClick={() => setSelectedEventId('all')}
                                >
                                    ALL EVENTS
                                </button>
                                {eventsWithPicks.slice(0, 4).map(event => (
                                    <button
                                        key={event.id}
                                        className={`event-tab ${selectedEventId === event.id ? 'event-tab--active' : ''}`}
                                        onClick={() => setSelectedEventId(event.id)}
                                    >
                                        {event.name.replace('UFC ', '').toUpperCase()}
                                        {event.status === 'scheduled' && ' (PENDING)'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Show selected event or all */}
                        {selectedEventId !== 'all' ? (
                            (() => {
                                const event = events.find(e => e.id === selectedEventId);
                                const picks = picksByEvent.get(selectedEventId) || [];
                                return event && picks.length > 0 ? (
                                    <EventPicksSection event={event} picks={picks} />
                                ) : null;
                            })()
                        ) : (
                            <>
                                {/* PENDING PICKS */}
                                {pendingEvents.map(event => {
                                    const picks = picksByEvent.get(event.id) || [];
                                    return <EventPicksSection key={event.id} event={event} picks={picks} />;
                                })}

                                {/* Divider between pending and completed */}
                                {pendingEvents.length > 0 && completedEvents.length > 0 && (
                                    <div className="section-divider">
                                        <div className="section-divider__line"></div>
                                        <span className="section-divider__text">COMPLETED EVENTS</span>
                                        <div className="section-divider__line"></div>
                                    </div>
                                )}

                                {/* COMPLETED PICKS */}
                                {completedEvents.map(event => {
                                    const picks = picksByEvent.get(event.id) || [];
                                    return <EventPicksSection key={event.id} event={event} picks={picks} />;
                                })}

                                {/* Empty state */}
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
