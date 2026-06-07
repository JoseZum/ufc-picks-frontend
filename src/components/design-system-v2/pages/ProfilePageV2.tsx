'use client';

import React, { useMemo } from 'react';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useCurrentUser, useMyLeaderboardPosition, useAllMyPicks, useGlobalLeaderboard, useLogout, useEvents } from '@/lib/hooks';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EventPicksSection } from '../EventPicksSection';

export const ProfilePageV2 = () => {
    const router = useRouter();
    const { data: currentUser, isLoading: userLoading } = useCurrentUser();
    const { data: myPosition } = useMyLeaderboardPosition('global');
    const { data: allPicks, isLoading: picksLoading } = useAllMyPicks();
    const { data: leaderboard } = useGlobalLeaderboard({ limit: 100 });
    const { data: eventsData } = useEvents({ limit: 50 });
    const logout = useLogout();

    const isLoading = userLoading || picksLoading;
    const totalUsers = leaderboard?.length || 0;
    const events = eventsData?.events || [];

    // Agrupar los picks del usuario por evento (para la sección "YOUR PICKS")
    const picksByEvent = useMemo(() => {
        const grouped = new Map<number, Array<{ pick: any, event: any }>>();
        if (!allPicks || !events.length) return grouped;
        allPicks.forEach(pick => {
            const event = events.find(e => e.id === pick.event_id);
            const existing = grouped.get(pick.event_id) || [];
            existing.push({ pick, event });
            grouped.set(pick.event_id, existing);
        });
        return grouped;
    }, [allPicks, events]);

    // Eventos con picks, más reciente primero
    const eventsWithPicks = useMemo(() => {
        return events
            .filter(e => picksByEvent.has(e.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [events, picksByEvent]);

    // Calculate stats from picks
    const stats = useMemo(() => {
        if (!allPicks) return { total: 0, correct: 0, incorrect: 0, accuracy: 0 };
        
        const decided = allPicks.filter(p => p.is_correct !== null);
        const correct = decided.filter(p => p.is_correct === true).length;
        const incorrect = decided.filter(p => p.is_correct === false).length;
        
        return {
            total: allPicks.length,
            correct,
            incorrect,
            accuracy: decided.length > 0 ? Math.round((correct / decided.length) * 100) : 0,
            pending: allPicks.filter(p => p.is_correct === null).length
        };
    }, [allPicks]);

    // Format join date
    const memberSince = currentUser?.created_at 
        ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
        : 'MEMBER';

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!currentUser && !isLoading) {
        return (
            <V2Layout>
                <NavBarV2 activePage="profile" />
                <div className="main" style={{ paddingTop: '100px', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '2rem' }}>LOGIN REQUIRED</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please log in to view your profile</p>
                    <a href="/auth" className="btn btn--primary" style={{ 
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--bg-dark)',
                        fontWeight: 'bold',
                        textDecoration: 'none'
                    }}>
                        LOGIN WITH GOOGLE
                    </a>
                </div>
            <MobileNav activePage="profile" />
        </V2Layout>
        );
    }

    return (
        <V2Layout>
            <NavBarV2 activePage="profile" />

            <div className="main" style={{ paddingTop: '70px' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : (
                    <>
                        <section className="profile-hero">
                            <div className="profile-hero__sidebar">
                                <div 
                                    className="profile-hero__avatar"
                                    style={{
                                        backgroundImage: currentUser?.profile_picture ? `url(${currentUser.profile_picture})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {!currentUser?.profile_picture && (currentUser?.name?.charAt(0)?.toUpperCase() || '?')}
                                </div>
                                <h1 className="profile-hero__name">{currentUser?.name?.toUpperCase()}</h1>
                                <p className="profile-hero__joined">MEMBER SINCE {memberSince}</p>

                                <div className="profile-hero__rank">
                                    <div className="profile-hero__rank-label">GLOBAL RANK</div>
                                    <div className="profile-hero__rank-value">#{myPosition?.rank || '-'}</div>
                                    <div className="profile-hero__rank-total">of {totalUsers} users</div>
                                </div>

                                <button 
                                    onClick={handleLogout}
                                    className="profile-hero__edit-btn"
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '0.5rem',
                                        backgroundColor: 'transparent',
                                        border: '2px solid var(--error)',
                                        color: 'var(--error)'
                                    }}
                                >
                                    <LogOut size={16} />
                                    LOGOUT
                                </button>
                            </div>

                            <div className="profile-hero__main">
                                <div className="profile-stats-grid">
                                    <div className="profile-stat-card">
                                        <div className="profile-stat-card__value">{stats.total}</div>
                                        <div className="profile-stat-card__label">TOTAL PICKS</div>
                                    </div>
                                    <div className="profile-stat-card">
                                        <div className="profile-stat-card__value profile-stat-card__value--success">{stats.correct}</div>
                                        <div className="profile-stat-card__label">CORRECT</div>
                                    </div>
                                    <div className="profile-stat-card">
                                        <div className="profile-stat-card__value profile-stat-card__value--error">{stats.incorrect}</div>
                                        <div className="profile-stat-card__label">INCORRECT</div>
                                    </div>
                                    <div className="profile-stat-card profile-stat-card--highlight">
                                        <div className="profile-stat-card__value profile-stat-card__value--accent">{stats.accuracy}%</div>
                                        <div className="profile-stat-card__label">ACCURACY</div>
                                    </div>
                                </div>

                                <div className="profile-points-row">
                                    <div className="profile-points-row__item">
                                        <span className="profile-points-row__value">{myPosition?.entry?.total_points?.toLocaleString() || 0}</span>
                                        <span className="profile-points-row__label">TOTAL POINTS</span>
                                    </div>
                                    <div className="profile-points-row__item">
                                        <span className="profile-points-row__value">{stats.pending}</span>
                                        <span className="profile-points-row__label">PENDING PICKS</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="profile-content">
                            {/* QUICK LINKS */}
                            <div className="section-header">
                                <h2 className="section-header__title">QUICK LINKS</h2>
                            </div>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                gap: '1rem',
                                marginBottom: '2rem'
                            }}>
                                <a href="/my-picks" style={{
                                    display: 'block',
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--bg-light)',
                                    border: '2px solid var(--border)',
                                    textDecoration: 'none',
                                    color: 'var(--text)',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>MY PICKS</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View all your predictions</div>
                                </a>
                                <a href="/events" style={{
                                    display: 'block',
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--bg-light)',
                                    border: '2px solid var(--border)',
                                    textDecoration: 'none',
                                    color: 'var(--text)',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>EVENTS</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browse upcoming fights</div>
                                </a>
                                <a href="/leaderboards" style={{
                                    display: 'block',
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--bg-light)',
                                    border: '2px solid var(--border)',
                                    textDecoration: 'none',
                                    color: 'var(--text)',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>LEADERBOARDS</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>See global rankings</div>
                                </a>
                            </div>

                            {/* YOUR PICKS - historial con resultado y puntos */}
                            <div className="section-header" style={{ marginTop: '3rem' }}>
                                <h2 className="section-header__title">YOUR PICKS</h2>
                            </div>

                            {eventsWithPicks.length > 0 ? (
                                eventsWithPicks.map(event => (
                                    <EventPicksSection
                                        key={event.id}
                                        event={event}
                                        picks={picksByEvent.get(event.id) || []}
                                    />
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <p>No picks yet.</p>
                                    <a href="/events" style={{ color: 'var(--accent)', marginTop: '1rem', display: 'inline-block' }}>
                                        Browse Events &rarr;
                                    </a>
                                </div>
                            )}
                        </section>
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
        <MobileNav activePage="profile" />
        </V2Layout>
    );
};
