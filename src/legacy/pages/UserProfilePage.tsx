"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile, useUserPicks, useUserPicksStats, useGlobalLeaderboard } from "@/lib/hooks";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { AccuracyChart } from "@/components/profile/AccuracyChart";
import { RankingCards } from "@/components/profile/RankingCards";
import { PickTimeline } from "@/components/profile/PickTimeline";
import { AchievementsGrid } from "@/components/profile/AchievementsGrid";
import type { UserPick } from "@/lib/api";

interface UserProfilePageProps {
  userId: string;
}

interface EventAccuracy {
  eventName: string;
  eventDate: string;
  total: number;
  correct: number;
  accuracy: number;
}

// Calculate accuracy by event for the chart
function calculateAccuracyByEvent(picks: UserPick[]): EventAccuracy[] {
  if (!picks || picks.length === 0) return [];

  const byEvent = picks.reduce((acc, pick) => {
    // Only include completed picks
    if (pick.is_correct === null) return acc;

    const eventId = pick.event_id;
    if (!acc[eventId]) {
      acc[eventId] = {
        eventName: pick.event_name,
        eventDate: pick.event_date,
        total: 0,
        correct: 0,
      };
    }
    acc[eventId].total++;
    if (pick.is_correct) acc[eventId].correct++;
    return acc;
  }, {} as Record<number, Omit<EventAccuracy, 'accuracy'>>);

  return Object.values(byEvent)
    .map((event) => ({
      ...event,
      accuracy: (event.correct / event.total) * 100,
    }))
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, 10);
}

// Get user rank from leaderboard
function getUserRank(userId: string, leaderboard: any[] | undefined): number | null {
  if (!leaderboard || leaderboard.length === 0) return null;
  const index = leaderboard.findIndex((entry) => entry.user_id === userId);
  return index >= 0 ? index + 1 : null;
}

export function UserProfilePage({ userId }: UserProfilePageProps) {
  const router = useRouter();

  // Fetch data
  const { data: profile, isLoading: profileLoading, error: profileError } = useUserProfile(userId);
  const { data: stats, isLoading: statsLoading } = useUserPicksStats(userId);
  const { data: picks, isLoading: picksLoading } = useUserPicks(userId, { limit: 50 });
  const { data: leaderboard } = useGlobalLeaderboard({ limit: 200 });

  // Calculate derived data
  const userRank = useMemo(() => getUserRank(userId, leaderboard), [userId, leaderboard]);
  const accuracyOverTime = useMemo(() => calculateAccuracyByEvent(picks || []), [picks]);
  const totalUsers = leaderboard?.length || 1247; // Fallback to mock value

  // Loading state
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brutalist-accent" />
      </div>
    );
  }

  // Error state
  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-400">User not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutalist-base font-mono pb-20">
      {/* Back Button */}
      <div className="max-w-[1400px] mx-auto p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mb-4 border-[3px] border-white/15 hover:border-brutalist-accent transition-all duration-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Hero Section */}
      <ProfileHero
        profile={profile}
        stats={stats}
        rank={userRank}
        totalUsers={totalUsers}
      />

      {/* Content Section */}
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8 space-y-12 mt-8">
        {/* Accuracy Evolution Chart */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/8">
            <h2 className="font-bebas text-2xl lg:text-3xl tracking-[3px] pl-4 border-l-[3px] border-brutalist-accent">
              ACCURACY EVOLUTION
            </h2>
          </div>
          <AccuracyChart data={accuracyOverTime} />
        </div>

        {/* Rankings Section */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/8">
            <h2 className="font-bebas text-2xl lg:text-3xl tracking-[3px] pl-4 border-l-[3px] border-brutalist-accent">
              RANKINGS
            </h2>
          </div>
          <RankingCards
            globalRank={userRank}
            totalUsers={totalUsers}
            totalPoints={profile.total_points}
          />
        </div>

        {/* Recent Picks History */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/8">
            <h2 className="font-bebas text-2xl lg:text-3xl tracking-[3px] pl-4 border-l-[3px] border-brutalist-accent">
              RECENT PICKS
            </h2>
          </div>
          {picksLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brutalist-accent" />
            </div>
          ) : (
            <PickTimeline picks={picks || []} />
          )}
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/8">
            <h2 className="font-bebas text-2xl lg:text-3xl tracking-[3px] pl-4 border-l-[3px] border-brutalist-accent">
              ACHIEVEMENTS
            </h2>
          </div>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brutalist-accent" />
            </div>
          ) : (
            <AchievementsGrid stats={stats} picks={picks || []} />
          )}
        </div>
      </div>

      {/* Footer - Brutalist Style */}
      <footer className="border-t-[3px] border-white/15 bg-brutalist-panel p-8 mt-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-[2px]">
          <div className="border border-white/8 p-6">
            <div className="text-[0.6rem] uppercase tracking-[3px] text-brutalist-accent mb-2">
              SYSTEM
            </div>
            <div className="text-sm text-gray-400">UFC PICKS v2.0</div>
          </div>
          <div className="border border-white/8 p-6">
            <div className="text-[0.6rem] uppercase tracking-[3px] text-brutalist-accent mb-2">
              PAGE
            </div>
            <div className="text-sm text-gray-400">PUBLIC PROFILE</div>
          </div>
          <div className="border border-white/8 p-6">
            <div className="text-[0.6rem] uppercase tracking-[3px] text-brutalist-accent mb-2">
              BUILD
            </div>
            <div className="text-sm text-gray-400">2026.02.04</div>
          </div>
          <div className="border border-white/8 p-6">
            <div className="text-[0.6rem] uppercase tracking-[3px] text-brutalist-accent mb-2">
              STATUS
            </div>
            <div className="text-sm text-gray-400">PRODUCTION</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
