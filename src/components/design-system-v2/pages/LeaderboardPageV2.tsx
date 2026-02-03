'use client';

import React, { useState } from 'react';
import { V2Layout } from '../V2Layout';
import { useGlobalLeaderboard, useCurrentUser, useMyLeaderboardPosition } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

export const LeaderboardPageV2 = () => {
    const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month'>('all');
    
    // Fetch real data
    const { data: currentUser } = useCurrentUser();
    const { data: myPosition } = useMyLeaderboardPosition('global');
    const { data: leaderboard, isLoading } = useGlobalLeaderboard({ 
        limit: 50,
        year: timeFilter === 'year' ? new Date().getFullYear() : undefined
    });

    // Get top 3 for podium
    const top3 = leaderboard?.slice(0, 3) || [];
    const restOfLeaderboard = leaderboard?.slice(3) || [];

    const formatRank = (rank: number) => String(rank).padStart(2, '0');

    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item">EVENTS</a>
                    <a href="/my-picks" className="nav__item">MY PICKS</a>
                    <a href="/leaderboards" className="nav__item nav__item--active">LEADERBOARDS</a>
                    <a href="/profile" className="nav__item">PROFILE</a>
                </div>
                <div className="nav__user">
                    <div className="nav__avatar" style={{ 
                        backgroundImage: currentUser?.profile_picture ? `url(${currentUser.profile_picture})` : 'none',
                        backgroundSize: 'cover'
                    }}></div>
                    <span>{currentUser?.name?.toUpperCase() || 'GUEST'}</span>
                </div>
            </nav>

            <div className="main">
                <header className="page-header">
                    <div>
                        <h1 className="page-header__title">LEADERBOARDS</h1>
                        <p className="page-header__subtitle">Global Rankings // Top Predictors</p>
                    </div>
                    <div className="page-header__filters">
                        <button 
                            className={`filter-btn ${timeFilter === 'all' ? 'filter-btn--active' : ''}`}
                            onClick={() => setTimeFilter('all')}
                        >
                            ALL TIME
                        </button>
                        <button 
                            className={`filter-btn ${timeFilter === 'year' ? 'filter-btn--active' : ''}`}
                            onClick={() => setTimeFilter('year')}
                        >
                            THIS YEAR
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : (
                    <>
                        {/* TOP 3 PODIUM */}
                        <div className="podium">
                            {top3[1] && (
                                <div className="podium__place podium__place--2">
                                    <span className="podium__rank">2</span>
                                    <div className="podium__avatar" style={{
                                        backgroundImage: top3[1].avatar_url ? `url(${top3[1].avatar_url})` : 'none',
                                        backgroundSize: 'cover'
                                    }}>
                                        {!top3[1].avatar_url && top3[1].username?.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="podium__name">{top3[1].username?.toUpperCase()}</h3>
                                    <div className="podium__stats">
                                        <div>
                                            <div className="podium__stat-value">{top3[1].total_points?.toLocaleString()}</div>
                                            <div className="podium__stat-label">POINTS</div>
                                        </div>
                                        <div>
                                            <div className="podium__stat-value">{Math.round((top3[1].accuracy || 0) * 100)}%</div>
                                            <div className="podium__stat-label">ACCURACY</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {top3[0] && (
                                <div className="podium__place podium__place--1">
                                    <span className="podium__rank">1</span>
                                    <div className="podium__avatar" style={{
                                        backgroundImage: top3[0].avatar_url ? `url(${top3[0].avatar_url})` : 'none',
                                        backgroundSize: 'cover'
                                    }}>
                                        {!top3[0].avatar_url && top3[0].username?.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="podium__name">{top3[0].username?.toUpperCase()}</h3>
                                    <div className="podium__stats">
                                        <div>
                                            <div className="podium__stat-value">{top3[0].total_points?.toLocaleString()}</div>
                                            <div className="podium__stat-label">POINTS</div>
                                        </div>
                                        <div>
                                            <div className="podium__stat-value">{Math.round((top3[0].accuracy || 0) * 100)}%</div>
                                            <div className="podium__stat-label">ACCURACY</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {top3[2] && (
                                <div className="podium__place podium__place--3">
                                    <span className="podium__rank">3</span>
                                    <div className="podium__avatar" style={{
                                        backgroundImage: top3[2].avatar_url ? `url(${top3[2].avatar_url})` : 'none',
                                        backgroundSize: 'cover'
                                    }}>
                                        {!top3[2].avatar_url && top3[2].username?.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="podium__name">{top3[2].username?.toUpperCase()}</h3>
                                    <div className="podium__stats">
                                        <div>
                                            <div className="podium__stat-value">{top3[2].total_points?.toLocaleString()}</div>
                                            <div className="podium__stat-label">POINTS</div>
                                        </div>
                                        <div>
                                            <div className="podium__stat-value">{Math.round((top3[2].accuracy || 0) * 100)}%</div>
                                            <div className="podium__stat-label">ACCURACY</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* YOUR POSITION */}
                        {currentUser && myPosition && (
                            <div className="your-position">
                                <div className="your-position__rank">#{myPosition.rank}</div>
                                <div className="your-position__user">
                                    <div className="your-position__avatar" style={{
                                        backgroundImage: currentUser.profile_picture ? `url(${currentUser.profile_picture})` : 'none',
                                        backgroundSize: 'cover'
                                    }}>
                                        {!currentUser.profile_picture && 'YOU'}
                                    </div>
                                    <div>
                                        <div className="your-position__name">{currentUser.name?.toUpperCase()}</div>
                                        <div className="your-position__label">YOUR POSITION</div>
                                    </div>
                                </div>
                                <div className="your-position__stat">
                                    <div className="your-position__stat-value">{myPosition.entry?.total_points?.toLocaleString() || 0}</div>
                                    <div className="your-position__stat-label">POINTS</div>
                                </div>
                                <div className="your-position__stat">
                                    <div className="your-position__stat-value">{Math.round((myPosition.entry?.accuracy || 0) * 100)}%</div>
                                    <div className="your-position__stat-label">ACCURACY</div>
                                </div>
                                <div className="your-position__stat">
                                    <div className="your-position__stat-value">{currentUser.picks_total || 0}</div>
                                    <div className="your-position__stat-label">PICKS</div>
                                </div>
                            </div>
                        )}

                        {/* FULL LEADERBOARD */}
                        {restOfLeaderboard.length > 0 && (
                            <div className="leaderboard-full">
                                <div className="leaderboard-full__header">
                                    <span>RANK</span>
                                    <span>USER</span>
                                    <span style={{ textAlign: 'right' }}>POINTS</span>
                                    <span style={{ textAlign: 'right' }}>ACCURACY</span>
                                    <span style={{ textAlign: 'right' }}>PICKS</span>
                                </div>

                                {restOfLeaderboard.map((entry) => (
                                    <a 
                                        key={entry.user_id} 
                                        href={`/users/${entry.user_id}`} 
                                        className="leaderboard-full__row"
                                    >
                                        <span className="leaderboard-full__rank">{formatRank(entry.rank)}</span>
                                        <div className="leaderboard-full__user">
                                            <div className="leaderboard-full__avatar" style={{
                                                backgroundImage: entry.avatar_url ? `url(${entry.avatar_url})` : 'none',
                                                backgroundSize: 'cover'
                                            }}>
                                                {!entry.avatar_url && entry.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="leaderboard-full__name">{entry.username?.toUpperCase()}</span>
                                        </div>
                                        <span className="leaderboard-full__points">{entry.total_points?.toLocaleString()}</span>
                                        <span className="leaderboard-full__accuracy">{Math.round((entry.accuracy || 0) * 100)}%</span>
                                        <span className="leaderboard-full__picks">{entry.picks_count || '-'}</span>
                                    </a>
                                ))}
                            </div>
                        )}

                        {(!leaderboard || leaderboard.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No leaderboard data available yet. Make some picks to get started!
                            </div>
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
                    <div className="footer__block">
                        <div className="footer__label">TOTAL USERS</div>
                        <div className="footer__text">{leaderboard?.length || 0} COMPETITORS</div>
                    </div>
                </div>
            </footer>
        </V2Layout>
    );
};
