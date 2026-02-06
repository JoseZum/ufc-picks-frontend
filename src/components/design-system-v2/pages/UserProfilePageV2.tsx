'use client';

import React from 'react';
import Link from 'next/link';
import { V2Layout } from '../V2Layout';
import { useUserProfile, useUserPicks, useUserPicksStats, useGlobalLeaderboard } from '@/lib/hooks';
import { Loader2, ArrowLeft } from 'lucide-react';
import './UserProfilePageV2.css';

interface UserProfilePageV2Props {
    userId: string;
}

export const UserProfilePageV2 = ({ userId }: UserProfilePageV2Props) => {
    const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
    const { data: stats, isLoading: statsLoading } = useUserPicksStats(userId);
    const { data: picks, isLoading: picksLoading } = useUserPicks(userId, { limit: 50 });
    const { data: leaderboard } = useGlobalLeaderboard({ limit: 200 });

    // Calculate user rank
    const userRank = React.useMemo(() => {
        if (!leaderboard) return null;
        const index = leaderboard.findIndex((entry) => entry.user_id === userId);
        return index >= 0 ? index + 1 : null;
    }, [userId, leaderboard]);

    const totalUsers = leaderboard?.length || 0;

    // Calculate method breakdown with accuracy
    const methodStats = React.useMemo(() => {
        if (!picks) return {
            KO: { total: 0, correct: 0, accuracy: 0 },
            SUB: { total: 0, correct: 0, accuracy: 0 },
            DEC: { total: 0, correct: 0, accuracy: 0 }
        };

        const stats = picks.reduce((acc, pick) => {
            if (pick.picked_method) {
                let method: 'KO' | 'SUB' | 'DEC';
                if (pick.picked_method === 'KO/TKO') method = 'KO';
                else if (pick.picked_method === 'SUB') method = 'SUB';
                else method = 'DEC';

                acc[method].total++;
                if (pick.is_correct) acc[method].correct++;
            }
            return acc;
        }, {
            KO: { total: 0, correct: 0, accuracy: 0 },
            SUB: { total: 0, correct: 0, accuracy: 0 },
            DEC: { total: 0, correct: 0, accuracy: 0 }
        });

        // Calculate accuracy percentages
        Object.keys(stats).forEach((key) => {
            const method = key as 'KO' | 'SUB' | 'DEC';
            stats[method].accuracy = stats[method].total > 0
                ? Math.round((stats[method].correct / stats[method].total) * 100)
                : 0;
        });

        return stats;
    }, [picks]);

    // Calculate perfect picks (method + round correct)
    const perfectPicks = React.useMemo(() => {
        if (!picks) return 0;
        return picks.filter(pick =>
            pick.is_correct &&
            pick.picked_method &&
            pick.picked_round
        ).length;
    }, [picks]);

    // Current streak
    const currentStreak = React.useMemo(() => {
        if (!picks) return 0;
        const sortedPicks = [...picks].sort((a, b) =>
            new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        );

        let streak = 0;
        for (const pick of sortedPicks) {
            if (pick.is_correct === null) continue; // Skip pending
            if (pick.is_correct) streak++;
            else break;
        }
        return streak;
    }, [picks]);

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
                        <div className="profile-hero__rank-total">OF {totalUsers} FIGHTERS</div>
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

                    {/* Recent Picks */}
                    <div className="recent-picks">
                        <div className="section-header">
                            <div className="section-header__label">RECENT PICKS</div>
                            <div className="section-header__count">{picks?.length || 0} TOTAL</div>
                        </div>

                        <div className="picks-timeline">
                            {picks?.slice(0, 10).map((pick) => {
                                const pickedFighter = pick.picked_corner === 'red' ? pick.fighter_red : pick.fighter_blue;
                                const otherFighter = pick.picked_corner === 'red' ? pick.fighter_blue : pick.fighter_red;
                                const statusClass = pick.is_correct === null ? 'pending' : pick.is_correct ? 'correct' : 'incorrect';

                                return (
                                    <div key={pick.id} className={`pick-row pick-row--${statusClass}`}>
                                        {/* Event Info */}
                                        <div className="pick-row__event">
                                            <div className="pick-row__event-name">{pick.event_name || 'Unknown Event'}</div>
                                            <div className="pick-row__event-date">
                                                {pick.event_date ? new Date(pick.event_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    timeZone: 'UTC'
                                                }).toUpperCase() : 'N/A'}
                                            </div>
                                        </div>

                                        {/* Fight Info */}
                                        <div className="pick-row__fight">
                                            <span className={`pick-row__fighter pick-row__fighter--${pick.picked_corner}`}>
                                                {pickedFighter?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                            <span className="pick-row__vs">VS</span>
                                            <span className="pick-row__fighter pick-row__fighter--faded">
                                                {otherFighter || 'Unknown'}
                                            </span>
                                        </div>

                                        {/* Pick Details */}
                                        <div className="pick-row__details">
                                            <div className="pick-row__method">
                                                <span className="pick-row__badge">{pick.picked_method}</span>
                                                {pick.picked_round && <span className="pick-row__badge">R{pick.picked_round}</span>}
                                            </div>
                                            <div className="pick-row__result">
                                                <span className={`pick-row__status pick-row__status--${statusClass}`}>
                                                    {pick.is_correct === null ? '⏱ PENDING' : pick.is_correct ? '✓ CORRECT' : '✗ INCORRECT'}
                                                </span>
                                                <span className={`pick-row__points pick-row__points--${statusClass}`}>
                                                    {pick.is_correct ? `+${pick.points_awarded || 1} PTS` : '0 PTS'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {(!picks || picks.length === 0) && (
                                <div className="picks-empty">
                                    <p>NO PICKS YET</p>
                                    <Link href="/events" className="picks-empty__cta">
                                        VIEW UPCOMING EVENTS →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </V2Layout>
    );
};
