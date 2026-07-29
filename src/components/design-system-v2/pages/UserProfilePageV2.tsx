'use client';

import React from 'react';
import Link from 'next/link';
import { V2Layout } from '../V2Layout';
import { EventPicksSection } from '../EventPicksSection';
import { useUserProfile, useUserPicks, useUserPicksStats, useGlobalLeaderboard, useEvents } from '@/lib/hooks';
import { getEventPosterUrl } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import './UserProfilePageV2.css';

interface UserProfilePageV2Props {
    userId: string;
}

export const UserProfilePageV2 = ({ userId }: UserProfilePageV2Props) => {
    const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
    const { data: stats } = useUserPicksStats(userId);
    // Traer todos los picks públicos (máx del backend) para cálculos correctos
    const { data: picks } = useUserPicks(userId, { limit: 200 });
    const { data: leaderboard } = useGlobalLeaderboard({ limit: 500 });
    const { data: eventsData } = useEvents({ limit: 50 });

    const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null);

    const events = eventsData?.events || [];

    // Rank global del usuario: usar el rank real de la entrada del leaderboard
    const userRank = React.useMemo(() => {
        if (!leaderboard) return null;
        const entry = leaderboard.find((e) => String(e.user_id) === String(userId));
        return entry ? entry.rank : null;
    }, [userId, leaderboard]);

    const totalUsers = leaderboard?.length || 0;

    // Desglose por método. La precisión se calcula sólo sobre picks ya evaluados
    // (excluye pendientes del denominador). "total" = picks hechos con ese método.
    const methodStats = React.useMemo(() => {
        const makeEmpty = () => ({
            KO: { total: 0, decided: 0, correct: 0, accuracy: 0 },
            SUB: { total: 0, decided: 0, correct: 0, accuracy: 0 },
            DEC: { total: 0, decided: 0, correct: 0, accuracy: 0 }
        });
        if (!picks) return makeEmpty();

        const result = picks.reduce((acc, pick) => {
            if (!pick.picked_method) return acc;

            let method: 'KO' | 'SUB' | 'DEC';
            if (pick.picked_method === 'KO/TKO') method = 'KO';
            else if (pick.picked_method === 'SUB') method = 'SUB';
            else method = 'DEC';

            acc[method].total++;
            if (pick.is_correct !== null && pick.is_correct !== undefined) {
                acc[method].decided++;
                if (pick.is_correct) acc[method].correct++;
            }
            return acc;
        }, makeEmpty());

        (Object.keys(result) as Array<'KO' | 'SUB' | 'DEC'>).forEach((method) => {
            result[method].accuracy = result[method].decided > 0
                ? Math.round((result[method].correct / result[method].decided) * 100)
                : 0;
        });

        return result;
    }, [picks]);

    // Perfect picks: usar el valor calculado por el backend (método + round correctos)
    const perfectPicks = stats?.perfect_picks || 0;

    // Racha actual: picks correctos consecutivos desde el más reciente evaluado.
    // Ordena por fecha de evento (fallback a created_at) y salta los pendientes.
    const currentStreak = React.useMemo(() => {
        if (!picks) return 0;
        const ts = (p: typeof picks[number]) =>
            new Date(p.event_date || p.created_at || 0).getTime();
        const sortedPicks = [...picks].sort((a, b) => ts(b) - ts(a));

        let streak = 0;
        for (const pick of sortedPicks) {
            if (pick.is_correct === null || pick.is_correct === undefined) continue; // pendiente
            if (pick.is_correct) streak++;
            else break;
        }
        return streak;
    }, [picks]);

    // Agrupar los picks del usuario por evento (para las tarjetas con imagen)
    const picksByEvent = React.useMemo(() => {
        const grouped = new Map<number, Array<{ pick: any; event: any }>>();
        if (!picks) return grouped;
        picks.forEach((pick) => {
            const realEvent = events.find((e) => e.id === pick.event_id);
            // Evento sintético si no está en la lista reciente (para nombre/fecha)
            const event = realEvent || {
                id: pick.event_id,
                name: pick.event_name || 'Unknown Event',
                date: pick.event_date,
                status: 'completed',
            };
            const existing = grouped.get(pick.event_id) || [];
            existing.push({ pick, event });
            grouped.set(pick.event_id, existing);
        });
        return grouped;
    }, [picks, events]);

    // Eventos con picks, más reciente primero
    const eventsWithPicks = React.useMemo(() => {
        return Array.from(picksByEvent.values())
            .map((arr) => arr[0].event)
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [picksByEvent]);

    const selectedEvent = selectedEventId != null
        ? eventsWithPicks.find((e) => e.id === selectedEventId)
        : null;

    if (profileLoading) {
        return (
            <V2Layout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="animate-spin h-10 w-10 text-white" />
                </div>
            </V2Layout>
        );
    }

    if (!profile) {
        return (
            <V2Layout>
                <div className="flex flex-col items-center justify-center h-screen gap-4">
                    <p className="text-gray-400">User not found</p>
                    <Link href="/leaderboard" className="text-brutalist-accent hover:underline">
                        ← Back to Leaderboard
                    </Link>
                </div>
            </V2Layout>
        );
    }

    const joinedDate = profile.created_at ?
        new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) :
        'Recently';

    return (
        <V2Layout>
            {/* Profile Hero */}
            <div className="profile-hero">
                {/* Sidebar */}
                <div className="profile-hero__sidebar">
                    <div className="profile-hero__avatar">
                        {profile.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="profile-hero__name">{profile.name || 'Anonymous'}</div>
                    <div className="profile-hero__joined">JOINED {joinedDate.toUpperCase()}</div>

                    {/* Rank */}
                    <div className="profile-hero__rank">
                        <div className="profile-hero__rank-label">GLOBAL RANK</div>
                        <div className="profile-hero__rank-value">#{userRank || '—'}</div>
                        <div className="profile-hero__rank-total">OF {totalUsers} USERS</div>
                    </div>

                    {/* Streak */}
                    {currentStreak > 0 && (
                        <div className="profile-hero__streak">
                            🔥 {currentStreak} PICK STREAK
                        </div>
                    )}
                </div>

                {/* Main Stats */}
                <div className="profile-hero__main">
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card stat-card--highlight">
                            <div className="stat-card__value stat-card__value--accent">
                                {stats?.accuracy?.toFixed(0) || 0}%
                            </div>
                            <div className="stat-card__label">ACCURACY</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card__value stat-card__value--success">
                                {stats?.correct_picks || 0}
                            </div>
                            <div className="stat-card__label">CORRECT</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card__value stat-card__value--error">
                                {stats?.incorrect_picks || 0}
                            </div>
                            <div className="stat-card__label">INCORRECT</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card__value">{stats?.total_picks || 0}</div>
                            <div className="stat-card__label">TOTAL PICKS</div>
                        </div>
                    </div>

                    {/* Perfect Picks Showcase */}
                    {perfectPicks > 0 && (
                        <div className="perfect-picks">
                            <div className="perfect-picks__content">
                                <div className="perfect-picks__icon">🎯</div>
                                <div className="perfect-picks__text">
                                    <div className="perfect-picks__value">{perfectPicks}</div>
                                    <div className="perfect-picks__label">PERFECT PREDICTIONS</div>
                                    <div className="perfect-picks__points">Method + Round Correct</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Method Breakdown */}
                    <div className="method-breakdown">
                        <div className="section-header">
                            <div className="section-header__label">METHOD BREAKDOWN</div>
                        </div>
                        <div className="method-grid">
                            <div className="method-card method-card--ko">
                                <div className="method-card__name">KO/TKO</div>
                                <div className="method-card__picks">{methodStats.KO.total}</div>
                                <div className="method-card__accuracy">{methodStats.KO.accuracy}%</div>
                                <div className="method-card__label">ACCURACY</div>
                            </div>

                            <div className="method-card method-card--sub">
                                <div className="method-card__name">SUBMISSION</div>
                                <div className="method-card__picks">{methodStats.SUB.total}</div>
                                <div className="method-card__accuracy">{methodStats.SUB.accuracy}%</div>
                                <div className="method-card__label">ACCURACY</div>
                            </div>

                            <div className="method-card method-card--dec">
                                <div className="method-card__name">DECISION</div>
                                <div className="method-card__picks">{methodStats.DEC.total}</div>
                                <div className="method-card__accuracy">{methodStats.DEC.accuracy}%</div>
                                <div className="method-card__label">ACCURACY</div>
                            </div>
                        </div>
                    </div>

                    {/* Picks por evento - tarjetas con imagen; al click se ven los picks */}
                    <div className="recent-picks-section">
                        <div className="recent-picks-header">
                            <div className="recent-picks-header__title">
                                {selectedEvent ? selectedEvent.name.toUpperCase() : 'PICKS BY EVENT'}
                            </div>
                            {selectedEvent ? (
                                <button className="recent-picks-header__back" onClick={() => setSelectedEventId(null)}>
                                    <ArrowLeft size={14} /> ALL EVENTS
                                </button>
                            ) : (
                                <div className="recent-picks-header__count">{eventsWithPicks.length} EVENTS</div>
                            )}
                        </div>

                        {eventsWithPicks.length === 0 ? (
                            <div className="picks-empty">
                                <p className="picks-empty__text">NO PICKS YET</p>
                                <Link href="/events" className="picks-empty__cta">
                                    VIEW UPCOMING EVENTS →
                                </Link>
                            </div>
                        ) : selectedEvent ? (
                            <EventPicksSection
                                event={selectedEvent}
                                picks={picksByEvent.get(selectedEvent.id) || []}
                            />
                        ) : (
                            <div className="browse-grid">
                                {eventsWithPicks.map((event) => (
                                    <button
                                        key={event.id}
                                        className={`browse-card ${event.is_bmf_title_fight ? 'event-card--bmf' : event.is_title_fight ? 'event-card--title' : ''}`}
                                        onClick={() => setSelectedEventId(event.id)}
                                    >
                                        <div
                                            className="browse-card__image"
                                            style={{
                                                backgroundImage: `url(${getEventPosterUrl(event)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        >
                                            {(event.is_title_fight || event.is_bmf_title_fight) && <span className="event-card__title-flag">★</span>}
                                        </div>
                                        <div className="browse-card__name">{event.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </V2Layout>
    );
};
