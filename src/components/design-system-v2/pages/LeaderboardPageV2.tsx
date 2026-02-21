'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useGlobalLeaderboard, useEventLeaderboard, useEvents, useCurrentUser } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

export const LeaderboardPageV2 = () => {
    const router = useRouter();
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    // Fetch events for the dropdown
    const { data: completedData } = useEvents({ status: 'completed', limit: 50 });
    const { data: scheduledData } = useEvents({ status: 'scheduled', limit: 50 });
    const allEvents = [
        ...(scheduledData?.events || []),
        ...(completedData?.events || []),
    ];

    // Fetch real data
    const { data: currentUser } = useCurrentUser();
    const { data: globalLeaderboard, isLoading: globalLoading } = useGlobalLeaderboard({
        limit: 50,
    });
    const { data: eventLeaderboard, isLoading: eventLoading } = useEventLeaderboard(selectedEventId || 0, 50);

    // Use event leaderboard when an event is selected, otherwise global
    const leaderboard = selectedEventId ? eventLeaderboard : globalLeaderboard;
    const isLoading = selectedEventId ? eventLoading : globalLoading;

    // Buscar la posición del usuario en el leaderboard actual (global o por evento)
    const myEntry = currentUser && leaderboard
        ? leaderboard.find(e => e.user_id === currentUser.id)
        : null;

    // Get top 3 for podium
    const top3 = leaderboard?.slice(0, 3) || [];
    const restOfLeaderboard = leaderboard?.slice(3) || [];

    const formatRank = (rank: number) => String(rank).padStart(2, '0');

    return (
        <V2Layout>
            <NavBarV2 activePage="leaderboard" />

            <div className="main">
                <header className="page-header">
                    <div>
                        <h1 className="page-header__title">LEADERBOARDS</h1>
                        <p className="page-header__subtitle">
                            {selectedEventId
                                ? `${allEvents.find(e => e.id === selectedEventId)?.name || 'Event'} // Points By Card`
                                : 'Global Rankings // Top Predictors'}
                        </p>
                    </div>
                    <div className="page-header__filters">
                        <select
                            className="event-filter-select"
                            value={selectedEventId || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedEventId(val ? Number(val) : null);
                            }}
                        >
                            <option value="">ALL EVENTS</option>
                            {allEvents.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
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
                                <div
                                    className="podium__place podium__place--2"
                                    onClick={() => router.push(`/users/${top3[1].user_id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
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
                                            <div className="podium__stat-value">{top3[1].picks_total ? Math.round(top3[1].picks_correct / top3[1].picks_total * 100) : 0}%</div>
                                            <div className="podium__stat-label">ACCURACY</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {top3[0] && (
                                <div
                                    className="podium__place podium__place--1"
                                    onClick={() => router.push(`/users/${top3[0].user_id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
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
                                            <div className="podium__stat-value">{top3[0].picks_total ? Math.round(top3[0].picks_correct / top3[0].picks_total * 100) : 0}%</div>
                                            <div className="podium__stat-label">ACCURACY</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {top3[2] && (
                                <div
                                    className="podium__place podium__place--3"
                                    onClick={() => router.push(`/users/${top3[2].user_id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
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
                                            <div className="podium__stat-value">{top3[2].picks_total ? Math.round(top3[2].picks_correct / top3[2].picks_total * 100) : 0}%</div>
                                            <div className="podium__stat-label">ACCURACY</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* YOUR POSITION */}
                        {currentUser && myEntry && (
                            <div className="your-position">
                                <div className="your-position__rank">#{myEntry.rank}</div>
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
                                    <div className="your-position__stat-value">{myEntry.total_points?.toLocaleString() || 0}</div>
                                    <div className="your-position__stat-label">POINTS</div>
                                </div>
                                <div className="your-position__stat">
                                    <div className="your-position__stat-value">{myEntry.picks_total ? Math.round(myEntry.picks_correct / myEntry.picks_total * 100) : 0}%</div>
                                    <div className="your-position__stat-label">ACCURACY</div>
                                </div>
                                <div className="your-position__stat">
                                    <div className="your-position__stat-value">{myEntry.picks_total || 0}</div>
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
                                        <span className="leaderboard-full__accuracy">{entry.picks_total ? Math.round(entry.picks_correct / entry.picks_total * 100) : 0}%</span>
                                        <span className="leaderboard-full__picks">{entry.picks_total || '-'}</span>
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
        <MobileNav activePage="leaderboard" />
        </V2Layout>
    );
};
