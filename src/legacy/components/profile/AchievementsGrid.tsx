"use client";

import { AchievementBadge, type Achievement } from "./AchievementBadge";
import type { UserPicksStats, UserPick } from "@/lib/api";

interface AchievementsGridProps {
  stats: UserPicksStats | undefined;
  picks: UserPick[];
}

function hasWinStreak(picks: UserPick[], streakLength: number): boolean {
  if (!picks || picks.length < streakLength) return false;

  // Sort picks by date descending
  const sortedPicks = [...picks]
    .filter(p => p.is_correct !== null)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  let currentStreak = 0;
  for (const pick of sortedPicks) {
    if (pick.is_correct === true) {
      currentStreak++;
      if (currentStreak >= streakLength) return true;
    } else {
      currentStreak = 0;
    }
  }

  return false;
}

export function AchievementsGrid({ stats, picks }: AchievementsGridProps) {
  const achievements: Achievement[] = [
    {
      id: 'first_blood',
      name: 'FIRST BLOOD',
      description: 'Make your first pick',
      icon: '🏆',
      unlocked: (stats?.total_picks || 0) > 0
    },
    {
      id: 'hot_streak',
      name: 'HOT STREAK',
      description: '5 correct picks in a row',
      icon: '🔥',
      unlocked: hasWinStreak(picks, 5)
    },
    {
      id: 'century',
      name: 'CENTURY',
      description: '100 total picks made',
      icon: '⭐',
      unlocked: (stats?.total_picks || 0) >= 100
    },
    {
      id: 'champion',
      name: 'CHAMPION',
      description: 'Reach top 10 globally',
      icon: '👑',
      unlocked: false // Would need global rank to determine
    },
    {
      id: 'analyst',
      name: 'ANALYST',
      description: '70% accuracy (min 50 picks)',
      icon: '🧠',
      unlocked: (stats?.accuracy || 0) >= 70 && (stats?.total_picks || 0) >= 50
    },
    {
      id: 'perfect_event',
      name: 'PERFECT EVENT',
      description: '100% accuracy on full card',
      icon: '🎯',
      unlocked: false // Would need per-event accuracy
    },
    {
      id: 'rising_star',
      name: 'RISING STAR',
      description: 'Gain 20 ranks in one event',
      icon: '🚀',
      unlocked: false // Would need rank history
    },
    {
      id: 'oracle',
      name: 'ORACLE',
      description: '80% accuracy (min 100 picks)',
      icon: '⚡',
      unlocked: (stats?.accuracy || 0) >= 80 && (stats?.total_picks || 0) >= 100
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px]">
      {achievements.map((achievement) => (
        <AchievementBadge key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}
