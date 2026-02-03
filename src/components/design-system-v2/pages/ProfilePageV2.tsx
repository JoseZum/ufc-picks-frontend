'use client';

import React, { useMemo } from 'react';
import { V2Layout } from '../V2Layout';
import { useCurrentUser, useMyLeaderboardPosition, useAllMyPicks, useGlobalLeaderboard, useLogout } from '@/lib/hooks';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const ProfilePageV2 = () => {
    const router = useRouter();
    const { data: currentUser, isLoading: userLoading } = useCurrentUser();
    const { data: myPosition } = useMyLeaderboardPosition('global');
    const { data: allPicks, isLoading: picksLoading } = useAllMyPicks();
    const { data: leaderboard } = useGlobalLeaderboard({ limit: 100 });
    const logout = useLogout();
    
    const isLoading = userLoading || picksLoading;
    const totalUsers = leaderboard?.length || 0;

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
                <nav className="nav">
                    <a href="/" className="nav__logo">UFC PICKS</a>
                    <div className="nav__items">
                        <a href="/" className="nav__item">HOME</a>
                        <a href="/events" className="nav__item">EVENTS</a>
                        <a href="/my-picks" className="nav__item">MY PICKS</a>
                        <a href="/leaderboards" className="nav__item">LEADERBOARDS</a>
                        <a href="/profile" className="nav__item nav__item--active">PROFILE</a>
                    </div>
                    <div className="nav__user">
                        <span>GUEST</span>
                    </div>
                </nav>
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
            </V2Layout>
        );
    }

    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item">EVENTS</a>
                    <a href="/my-picks" className="nav__item">MY PICKS</a>
                    <a href="/leaderboards" className="nav__item">LEADERBOARDS</a>
                    <a href="/profile" className="nav__item nav__item--active">PROFILE</a>
                </div>
                <div className="nav__user">
                    <div className="nav__avatar" style={{
                        backgroundImage: currentUser?.profile_picture ? `url(${currentUser.profile_picture})` : 'none',
                        backgroundSize: 'cover'
                    }}></div>
                    <span>{currentUser?.name?.toUpperCase() || 'GUEST'}</span>
                </div>
            </nav>

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

                                <div className="accuracy-section">
                                    <div className="accuracy-section__header">
                                        <h3 className="accuracy-section__title">YOUR STATISTICS</h3>
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                        gap: '1rem',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{
                                            padding: '1.5rem',
                                            backgroundColor: 'var(--bg-light)',
                                            border: '2px solid var(--border)'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {myPosition?.entry?.total_points?.toLocaleString() || 0}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                TOTAL POINTS
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '1.5rem',
                                            backgroundColor: 'var(--bg-light)',
                                            border: '2px solid var(--border)'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                                                {stats.pending}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                PENDING PICKS
                                            </div>
                                        </div>
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

                            {/* ACHIEVEMENTS (Future feature - keeping as placeholder) */}
                            <div className="section-header" style={{ marginTop: '3rem' }}>
                                <h2 className="section-header__title">ACHIEVEMENTS</h2>
                            </div>

                            <div className="achievements-grid">
                                <div className={`achievement ${stats.total >= 1 ? 'achievement--unlocked' : ''}`}>
                                    <div className="achievement__icon">&#127942;</div>
                                    <div className="achievement__name">FIRST BLOOD</div>
                                    <div className="achievement__desc">Make your first pick</div>
                                </div>
                                <div className={`achievement ${stats.correct >= 5 ? 'achievement--unlocked' : ''}`}>
                                    <div className="achievement__icon">&#128293;</div>
                                    <div className="achievement__name">ON FIRE</div>
                                    <div className="achievement__desc">5 correct picks</div>
                                </div>
                                <div className={`achievement ${stats.total >= 100 ? 'achievement--unlocked' : ''}`}>
                                    <div className="achievement__icon">&#127775;</div>
                                    <div className="achievement__name">CENTURY</div>
                                    <div className="achievement__desc">100 total picks made</div>
                                </div>
                                <div className={`achievement ${(myPosition?.rank || 999) <= 10 ? 'achievement--unlocked' : ''}`}>
                                    <div className="achievement__icon">&#128081;</div>
                                    <div className="achievement__name">CHAMPION</div>
                                    <div className="achievement__desc">Reach top 10 globally</div>
                                </div>
                                <div className={`achievement ${stats.accuracy >= 70 && stats.total >= 50 ? 'achievement--unlocked' : ''}`}>
                                    <div className="achievement__icon">&#129504;</div>
                                    <div className="achievement__name">ANALYST</div>
                                    <div className="achievement__desc">70% accuracy (min 50 picks)</div>
                                </div>
                                <div className="achievement">
                                    <div className="achievement__icon">&#127919;</div>
                                    <div className="achievement__name">PERFECT EVENT</div>
                                    <div className="achievement__desc">100% accuracy on full card</div>
                                </div>
                                <div className="achievement">
                                    <div className="achievement__icon">&#128640;</div>
                                    <div className="achievement__name">RISING STAR</div>
                                    <div className="achievement__desc">Gain 20 ranks in one event</div>
                                </div>
                                <div className={`achievement ${stats.accuracy >= 80 && stats.total >= 100 ? 'achievement--unlocked' : ''}`}>
                                    <div className="achievement__icon">&#9889;</div>
                                    <div className="achievement__name">ORACLE</div>
                                    <div className="achievement__desc">80% accuracy (min 100 picks)</div>
                                </div>
                            </div>
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
        </V2Layout>
    );
};
