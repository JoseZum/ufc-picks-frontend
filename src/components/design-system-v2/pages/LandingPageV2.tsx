'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { useCountdown } from '../hooks/useCountdown';
import { useEvents, useGlobalLeaderboard, useEventBouts, useCurrentUser, useMyLeaderboardPosition } from '@/lib/hooks';
import { getEventPosterUrl, getFighterImageUrl, getEventImageUrl } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export const LandingPageV2 = () => {
    const router = useRouter();

    // 1. Get Next Event
    const { data: eventsData, isLoading: eventsLoading } = useEvents({
        status: 'scheduled',
        limit: 1
    });
    const nextEvent = eventsData?.events?.[0];

    // 2. Get Main Event Bout
    const { data: bouts } = useEventBouts(nextEvent?.id || 0);
    const mainEventBout = bouts?.[0];

    // 3. Get Leaderboard
    const { data: leaderboard, isLoading: leaderboardLoading } = useGlobalLeaderboard({
        limit: 5
    });

    // 4. Get User Stats
    const { data: currentUser } = useCurrentUser();
    const { data: myPosition } = useMyLeaderboardPosition('global');

    // Countdown timer
    const eventDate = nextEvent ? new Date(nextEvent.date) : null;
    const { formatted, isExpired } = useCountdown(eventDate);

    // Format date and venue
    const formatEventDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }).toUpperCase();
    };

    return (
        <V2Layout>
            <NavBarV2 activePage="home" />

            <main className="main">
                {/* HERO SECTION - BROKEN GRID */}
                <section className="hero">
                    <div className="hero__event">
                        <div className="hero__event-image" style={{
                            backgroundImage: nextEvent ? `url(${getEventImageUrl(nextEvent)})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'top center'
                        }}>
                            {eventsLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                                </div>
                            )}
                            <span className={`hero__event-badge ${isExpired ? 'hero__event-badge--locked' : ''}`}>
                                {isExpired ? 'LOCKED' : 'OPEN FOR PICKS'}
                            </span>
                        </div>
                        <div className="hero__event-content">
                            {nextEvent ? (
                                <>
                                    <h1 className="hero__event-title">{nextEvent.name}</h1>
                                    <p className="hero__event-subtitle">
                                        {formatEventDate(nextEvent.date)} // {nextEvent.location?.venue ? `${nextEvent.location.venue}, ${nextEvent.location.city}` : (nextEvent.location?.city || 'VENUE TBA')}
                                    </p>
                                    <div className="hero__countdown">
                                        <div className="hero__countdown-label">TIME UNTIL EVENT</div>
                                        <div className="hero__countdown-time">
                                            {formatted.days}D : {formatted.hours}H : {formatted.minutes}M : {formatted.seconds}S
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <h1 className="hero__event-title">No Upcoming Events</h1>
                            )}
                        </div>
                    </div>

                    <div className="hero__stats">
                        <div className="hero__stats-title">EVENT STATS</div>
                        <div className="hero__stats-grid">
                            <div className="hero__stat">
                                <div className="hero__stat-value">{nextEvent?.total_bouts || 0}</div>
                                <div className="hero__stat-label">TOTAL FIGHTS</div>
                            </div>
                            <div className="hero__stat">
                                <div className="hero__stat-value">{bouts?.filter(b => b.is_title_fight).length || 0}</div>
                                <div className="hero__stat-label">TITLE FIGHTS</div>
                            </div>
                        </div>
                    </div>

                    <a href={nextEvent ? `/events/${nextEvent.id}` : '#'} className="hero__action glitch">
                        <span className="hero__action-text">MAKE YOUR PICKS</span>
                        <span className="hero__action-arrow">→</span>
                    </a>
                </section>

                {/* MAIN EVENT - BRUTAL VS CARD */}
                {mainEventBout && (
                    <div className="main-event">
                        <div className="main-event__header">
                            Main Event // {mainEventBout.weight_class} {mainEventBout.is_title_fight ? 'Title' : 'Bout'}
                        </div>
                        <div className="main-event__content">
                            <div className="main-event__fighter main-event__fighter--red">
                                <div className="main-event__photo">
                                    <img
                                        src={getFighterImageUrl(mainEventBout.fighters.red)}
                                        alt={mainEventBout.fighters.red.fighter_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                    {/* Fallback placeholder styled via CSS if img fails/missing */}
                                </div>
                                <div className="main-event__name">{mainEventBout.fighters.red.fighter_name}</div>
                                <div className="main-event__record">
                                    {mainEventBout.fighters.red.record_at_fight ?
                                        `${mainEventBout.fighters.red.record_at_fight.wins}-${mainEventBout.fighters.red.record_at_fight.losses}-${mainEventBout.fighters.red.record_at_fight.draws}`
                                        : 'Record N/A'}
                                </div>
                                <div className="main-event__country">
                                    <span className="main-event__flag">{/* Flag logic to be added */}</span>
                                    {mainEventBout.fighters.red.nationality || 'Unknown'}
                                </div>
                            </div>

                            <div className="main-event__vs">
                                <div className="main-event__vs-text">VS</div>
                            </div>

                            <div className="main-event__fighter main-event__fighter--blue">
                                <div className="main-event__photo">
                                    <img
                                        src={getFighterImageUrl(mainEventBout.fighters.blue)}
                                        alt={mainEventBout.fighters.blue.fighter_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                </div>
                                <div className="main-event__name">{mainEventBout.fighters.blue.fighter_name}</div>
                                <div className="main-event__record">
                                    {mainEventBout.fighters.blue.record_at_fight ?
                                        `${mainEventBout.fighters.blue.record_at_fight.wins}-${mainEventBout.fighters.blue.record_at_fight.losses}-${mainEventBout.fighters.blue.record_at_fight.draws}`
                                        : 'Record N/A'}
                                </div>
                                <div className="main-event__country">
                                    <span className="main-event__flag">{/* Flag logic to be added */}</span>
                                    {mainEventBout.fighters.blue.nationality || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* USER STATS - BRUTALIST CARDS */}
                <section className="stats-section">
                    <h2 className="stats-section__title">YOUR STATS</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card__label">PICKS MADE</div>
                            <div className="stat-card__value">{currentUser?.picks_total || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__label">GLOBAL RANK</div>
                            <div className="stat-card__value">#{myPosition?.rank || '-'}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__label">ACCURACY</div>
                            <div className="stat-card__value">
                                {currentUser?.accuracy ? Math.round(currentUser.accuracy * 100) : 0}
                                <span className="stat-card__suffix">%</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LEADERBOARD - RAW TABLE */}
                <section className="leaderboard">
                    <div className="leaderboard__header">
                        <h2 className="leaderboard__title">TOP PREDICTORS</h2>
                        <a href="/leaderboards" className="leaderboard__link">VIEW ALL →</a>
                    </div>
                    <table className="leaderboard__table">
                        <tbody>
                            {leaderboardLoading ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading Leaderboard...</td></tr>
                            ) : (leaderboard || []).map((user, index) => (
                                <tr key={user.user_id} className={`leaderboard__row ${index === 0 ? 'leaderboard__row--highlight' : ''}`}>
                                    <td className={`leaderboard__cell leaderboard__rank leaderboard__rank--${index + 1}`}>
                                        {String(user.rank).padStart(2, '0')}
                                    </td>
                                    <td className="leaderboard__cell">
                                        <div className="leaderboard__user">
                                            <div className="leaderboard__avatar" style={{
                                                backgroundImage: `url(${user.avatar_url || ''})`,
                                                backgroundSize: 'cover',
                                                backgroundColor: 'var(--bg-elevated)'
                                            }}>
                                                {!user.avatar_url && user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="leaderboard__name">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="leaderboard__cell leaderboard__points">{user.total_points}</td>
                                    <td className="leaderboard__cell leaderboard__accuracy">
                                        {Math.round(user.accuracy * 100)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* FOOTER - EXPOSED STRUCTURE */}
                <footer className="footer">
                    <div className="footer__grid">
                        <div className="footer__block">
                            <div className="footer__label">System Status</div>
                            <div className="footer__text mono">ALL SYSTEMS OPERATIONAL</div>
                        </div>
                        <div className="footer__block">
                            <div className="footer__label">Version</div>
                            <div className="footer__text mono">V2.0.0 [BETA]</div>
                        </div>
                        <div className="footer__block">
                            <div className="footer__label">Legal</div>
                            <div className="footer__text">TERMS // PRIVACY</div>
                        </div>
                        <div className="footer__block">
                            <div className="footer__label">Contact</div>
                            <div className="footer__text">JOSEZUMBRU@GMAIL.COM</div>
                        </div>
                    </div>
                </footer>
            </main>
        </V2Layout>
    );
};
