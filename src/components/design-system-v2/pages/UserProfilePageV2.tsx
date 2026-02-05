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

    // Calculate method breakdown
    const methodStats = React.useMemo(() => {
        if (!picks) return { KO: 0, SUB: 0, DEC: 0 };
        return picks.reduce((acc, pick) => {
            if (pick.is_correct && pick.picked_method) {
                if (pick.picked_method === 'KO/TKO') acc.KO++;
                else if (pick.picked_method === 'SUB') acc.SUB++;
                else if (pick.picked_method === 'DEC') acc.DEC++;
            }
            return acc;
        }, { KO: 0, SUB: 0, DEC: 0 });
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
                                <div className="method-card__icon">👊</div>
                                <div className="method-card__value">{methodStats.KO}</div>
                                <div className="method-card__label">KO/TKO</div>
                            </div>

                            <div className="method-card method-card--sub">
                                <div className="method-card__icon">🤼</div>
                                <div className="method-card__value">{methodStats.SUB}</div>
                                <div className="method-card__label">SUBMISSION</div>
                            </div>

                            <div className="method-card method-card--dec">
                                <div className="method-card__icon">⚖️</div>
                                <div className="method-card__value">{methodStats.DEC}</div>
                                <div className="method-card__label">DECISION</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Picks */}
                    <div className="recent-picks">
                        <div className="section-header">
                            <div className="section-header__label">RECENT PICKS</div>
                            <div className="section-header__count">{picks?.length || 0} TOTAL</div>
                        </div>

                        <div className="picks-list">
                            {picks?.slice(0, 10).map((pick) => {
                                const pickedFighter = pick.picked_corner === 'red' ? pick.fighter_red : pick.fighter_blue;
                                return (
                                    <div key={pick.id} className={`pick-item ${pick.is_correct ? 'pick-item--correct' : pick.is_correct === false ? 'pick-item--incorrect' : 'pick-item--pending'}`}>
                                        <div className="pick-item__status">
                                            {pick.is_correct === null ? '⏱️' : pick.is_correct ? '✓' : '✗'}
                                        </div>
                                        <div className="pick-item__info">
                                            <div className="pick-item__fighter">{pickedFighter || 'Fighter'}</div>
                                            <div className="pick-item__event">{pick.event_name}</div>
                                        </div>
                                        <div className="pick-item__method">
                                            {pick.picked_method}
                                            {pick.picked_round && ` R${pick.picked_round}`}
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
