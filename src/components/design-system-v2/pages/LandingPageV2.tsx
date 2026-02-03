'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { useCountdown } from '../hooks/useCountdown';
import { useEvents, useGlobalLeaderboard, useEventBouts, useCurrentUser, useMyLeaderboardPosition } from '@/lib/hooks';
import { getEventPosterUrl, getFighterImageUrl } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export const LandingPageV2 = () => {
    const router = useRouter();

    // 1. Get Next Event
    const { data: events, isLoading: eventsLoading } = useEvents({
        status: 'scheduled',
        limit: 1
    });
    const nextEvent = events?.[0];

    // 2. Get Main Event Bout
    const { data: bouts } = useEventBouts(nextEvent?.id || 0);
    const mainEventBout = bouts?.[0]; // First bout is usually main event in this API

    // 3. Get Leaderboard
    const { data: leaderboard, isLoading: leaderboardLoading } = useGlobalLeaderboard({
        limit: 3
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

            <div className="main">
                {/* NEXT EVENT HERO */}
                {eventsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : nextEvent ? (
                    <section className="next-event-hero">
                        <div className="next-event-hero__badge">
                            {isExpired ? 'EVENT STARTED' : 'OPEN FOR PICKS'}
                        </div>
                        <div className="next-event-hero__bg-text">{nextEvent.name.replace('UFC ', 'UFC ')}</div>
                        <div className="next-event-hero__divider"></div>
                        <h1 className="next-event-hero__title">{nextEvent.name}</h1>
                        <p className="next-event-hero__meta">
                            {formatEventDate(nextEvent.date)} // {nextEvent.venue || nextEvent.location || 'VENUE TBA'}
                        </p>
                        <div className="next-event-hero__countdown">
                            <div className="next-event-hero__countdown-label">TIME UNTIL EVENT</div>
                            <div className="next-event-hero__countdown-time">
                                {formatted.days}D : {formatted.hours}H : {formatted.minutes}M : {formatted.seconds}S
                            </div>
                        </div>
                        <a href={`/events/${nextEvent.id}`} className="next-event-hero__cta">
                            MAKE YOUR PICKS →
                        </a>
                    </section>
                ) : (
                    <section className="next-event-hero" style={{ padding: '4rem', textAlign: 'center' }}>
                        <h1 className="next-event-hero__title">NO UPCOMING EVENTS</h1>
                        <p className="next-event-hero__meta">Check back soon for the next UFC event</p>
                    </section>
                )}

                {/* HERO SECTION - ASYMMETRIC MASONRY */}
                <div className="hero">
                    <div className="hero__event">
                        <div className="hero__event-image" style={{
                            backgroundImage: nextEvent ? `url(${getEventPosterUrl(nextEvent)})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'top center'
                        }}>
                            {!nextEvent && eventsLoading && <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}
                            <span className="hero__event-badge">Next Event</span>
                        </div>
                        <div className="hero__event-content">
                            {nextEvent ? (
                                <>
                                    <div className="hero__event-title">{nextEvent.name}</div>
                                    <div className="hero__event-subtitle">
                                        {mainEventBout ?
                                            `${mainEventBout.fighters.red.fighter_name} vs ${mainEventBout.fighters.blue.fighter_name}`
                                            : 'Fight Card Announced Soon'}
                                    </div>

                                    <div className="hero__countdown">
                                        <div className="hero__countdown-label">Event Date</div>
                                        <div className="hero__countdown-time" style={{ fontSize: '2rem' }}>
                                            {eventDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <div className="hero__stats">
                                        <div className="hero__stats-title">Total Fights</div>
                                        <div className="hero__stats-grid">
                                            <div className="hero__stat">
                                                <div className="hero__stat-value" style={{ color: 'var(--text-primary)' }}>{nextEvent.total_bouts}</div>
                                                <div className="hero__stat-label">Bouts</div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="hero__event-title">No Upcoming Events</div>
                            )}
                        </div>
                    </div>

                    <a href={nextEvent ? `/events/${nextEvent.id}` : '#'} className="hero__action">
                        <div className="hero__action-text">Make Your Picks</div>
                        <div className="hero__action-arrow">→</div>
                    </a>
                </div>

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
                                <div className="main-event__vs-text">VERSUS</div>
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
                <div className="stats-section">
                    <div className="stats-section__title">Your Season Stats</div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card__label">Total Points</div>
                            <div className="stat-card__value">{currentUser?.total_points || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__label">Global Rank</div>
                            <div className="stat-card__value"><span className="stat-card__suffix">#</span>{myPosition?.rank || '-'}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__label">Accuracy</div>
                            <div className="stat-card__value">
                                {currentUser?.accuracy ? Math.round(currentUser.accuracy * 100) : 0}
                                <span className="stat-card__suffix">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LEADERBOARD - RAW TABLE */}
                <div className="leaderboard">
                    <div className="leaderboard__header">
                        <div className="leaderboard__title">Top Players</div>
                        <a href="/leaderboards" className="leaderboard__link">View Full Leaderboard</a>
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
                </div>

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
                            <div className="footer__text">SUPPORT@UFCPICKS.COM</div>
                        </div>
                    </div>
                </footer>
            </div>
        </V2Layout>
    );
};
