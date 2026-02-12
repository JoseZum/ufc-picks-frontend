"use client";

import { UserAvatar } from "@/components/UserAvatar";
import type { PublicUserProfile, UserPicksStats } from "@/lib/api";

interface ProfileHeroProps {
  profile: PublicUserProfile;
  stats: UserPicksStats | undefined;
  rank: number | null;
  totalUsers: number;
}

export function ProfileHero({ profile, stats, rank, totalUsers }: ProfileHeroProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-[2px] min-h-[500px] border-b-[3px] border-white/15">
      {/* Sidebar - UFC Red Background */}
      <div className="bg-brutalist-accent p-8 lg:p-12 flex flex-direction col gap-6 items-center text-center border-r-[3px] border-white/15">
        <UserAvatar
          src={profile.avatar_url}
          name={profile.name}
          className="w-[150px] h-[150px] text-6xl border-[4px] border-white"
        />

        <h1 className="font-bebas text-4xl lg:text-5xl tracking-[3px] text-white">
          {profile.name}
        </h1>

        <p className="text-xs uppercase tracking-[2px] text-white/70">
          Member Since {formatDate(profile.created_at)}
        </p>

        {/* Global Rank Card */}
        <div className="bg-brutalist-base border-[3px] border-white p-6 w-full">
          <div className="text-[0.6rem] uppercase tracking-[3px] text-gray-500 mb-2">
            GLOBAL RANK
          </div>
          <div className="font-bebas text-5xl text-white leading-none">
            #{rank || '?'}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            of {totalUsers.toLocaleString()} users
          </div>
        </div>

        {/* Optional: Win Streak */}
        {stats && stats.correct_picks >= 5 && (
          <div className="bg-green-500 text-black py-3 px-4 text-sm uppercase tracking-[2px] font-bold w-full text-center">
            🔥 {stats.correct_picks}-WIN STREAK
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-brutalist-base p-6 lg:p-8 flex flex-col gap-8">
        {/* Stats Grid - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2px]">
          <div className="bg-brutalist-panel border-[3px] border-white/15 p-6 text-center transition-all duration-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_#e10600]">
            <div className="font-bebas text-5xl leading-none">{profile.picks_total}</div>
            <div className="text-[0.6rem] uppercase tracking-[2px] text-gray-500 mt-2">TOTAL PICKS</div>
          </div>

          <div className="bg-brutalist-panel border-[3px] border-white/15 p-6 text-center transition-all duration-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_#e10600]">
            <div className="font-bebas text-5xl leading-none text-green-500">{profile.picks_correct}</div>
            <div className="text-[0.6rem] uppercase tracking-[2px] text-gray-500 mt-2">CORRECT</div>
          </div>

          <div className="bg-brutalist-panel border-[3px] border-white/15 p-6 text-center transition-all duration-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_#e10600]">
            <div className="font-bebas text-5xl leading-none text-red-500">
              {profile.picks_total - profile.picks_correct}
            </div>
            <div className="text-[0.6rem] uppercase tracking-[2px] text-gray-500 mt-2">INCORRECT</div>
          </div>

          <div className="bg-brutalist-panel border-[3px] border-brutalist-accent p-6 text-center shadow-[0_0_20px_rgba(225,6,0,0.1)] transition-all duration-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_#e10600]">
            <div className="font-bebas text-5xl leading-none text-brutalist-accent">
              {profile.accuracy.toFixed(1)}%
            </div>
            <div className="text-[0.6rem] uppercase tracking-[2px] text-gray-500 mt-2">ACCURACY</div>
          </div>
        </div>

        {/* Perfect Picks Showcase */}
        <div className="bg-brutalist-accent-dim border-[3px] border-brutalist-accent p-8 flex items-center justify-between shadow-[6px_6px_0_rgba(225,6,0,0.3)]">
          <div className="flex items-center gap-6">
            <div className="text-5xl">🏆</div>
            <div>
              <div className="font-bebas text-5xl leading-none text-brutalist-accent">
                {profile.perfect_picks}
              </div>
              <div className="text-sm uppercase tracking-[2px] text-gray-400">PERFECT PICKS</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">3 POINTS EACH</div>
        </div>

        {/* Method Breakdown - 3 columns with rotations */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
            <div className="bg-brutalist-panel border-[3px] border-white/15 p-8 text-center transition-all duration-100 hover:rotate-0 hover:scale-105 hover:border-brutalist-accent hover:z-10 -rotate-brutal-1 shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
              <div className="text-[0.7rem] uppercase tracking-[2px] text-gray-500 mb-4">DECISION</div>
              <div className="font-bebas text-4xl leading-none mb-2">{stats.by_method.DEC || 0}</div>
              <div className="text-3xl text-brutalist-accent">--</div>
              <div className="text-[0.65rem] text-gray-400 mt-1">PICKS</div>
            </div>

            <div className="bg-brutalist-panel border-[3px] border-brutalist-accent p-8 text-center transition-all duration-100 hover:rotate-0 hover:scale-105 hover:border-brutalist-accent hover:z-10 rotate-brutal-2 z-[1]">
              <div className="text-[0.7rem] uppercase tracking-[2px] text-gray-500 mb-4">KO/TKO</div>
              <div className="font-bebas text-4xl leading-none mb-2">{stats.by_method['KO/TKO'] || 0}</div>
              <div className="text-3xl text-brutalist-accent">--</div>
              <div className="text-[0.65rem] text-gray-400 mt-1">PICKS</div>
            </div>

            <div className="bg-brutalist-panel border-[3px] border-white/15 p-8 text-center transition-all duration-100 hover:rotate-0 hover:scale-105 hover:border-brutalist-accent hover:z-10">
              <div className="text-[0.7rem] uppercase tracking-[2px] text-gray-500 mb-4">SUBMISSION</div>
              <div className="font-bebas text-4xl leading-none mb-2">{stats.by_method.SUB || 0}</div>
              <div className="text-3xl text-brutalist-accent">--</div>
              <div className="text-[0.65rem] text-gray-400 mt-1">PICKS</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
