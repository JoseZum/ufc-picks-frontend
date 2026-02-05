"use client";

interface RankingCardsProps {
  globalRank: number | null;
  totalUsers: number;
  totalPoints: number;
}

export function RankingCards({ globalRank, totalUsers, totalPoints }: RankingCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px]">
      {/* Global Ranking Card */}
      <div className="bg-brutalist-panel border-[3px] border-white/15 p-8">
        <div className="text-[0.7rem] uppercase tracking-[2px] text-gray-500 mb-4 pb-3 border-b border-white/8">
          GLOBAL RANKING
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <div className="font-bebas text-6xl lg:text-7xl leading-none text-brutalist-accent">
            #{globalRank || '?'}
          </div>
          <div className="text-xl text-green-500">↑ +5</div>
        </div>

        <div className="text-base text-gray-400 mb-4">
          of {totalUsers.toLocaleString()} users
        </div>

        <div className="text-sm text-gray-500">
          <span className="font-bebas text-2xl text-white">{totalPoints.toLocaleString()}</span> TOTAL POINTS
        </div>
      </div>

      {/* Category Rankings Card */}
      <div className="bg-brutalist-panel border-[3px] border-white/15 p-8">
        <div className="text-[0.7rem] uppercase tracking-[2px] text-gray-500 mb-4 pb-3 border-b border-white/8">
          CATEGORY RANKINGS
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-brutalist-elevated border-l-2 border-brutalist-accent">
            <div className="text-[0.7rem] uppercase tracking-[1px] text-gray-400">KO Specialist</div>
            <div className="font-bebas text-2xl text-white">#12</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-brutalist-elevated border-l-2 border-brutalist-accent">
            <div className="text-[0.7rem] uppercase tracking-[1px] text-gray-400">Main Events</div>
            <div className="font-bebas text-2xl text-white">#28</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-brutalist-elevated border-l-2 border-brutalist-accent">
            <div className="text-[0.7rem] uppercase tracking-[1px] text-gray-400">Prelims Expert</div>
            <div className="font-bebas text-2xl text-white">#51</div>
          </div>
        </div>
      </div>
    </div>
  );
}
