"use client";

import { cn } from "@/lib/utils";
import type { UserPick } from "@/lib/api";

interface PickTimelineProps {
  picks: UserPick[];
}

export function PickTimeline({ picks }: PickTimelineProps) {
  if (!picks || picks.length === 0) {
    return (
      <div className="bg-brutalist-panel border-[3px] border-white/15 p-8 text-center text-gray-500">
        <p>No picks available yet</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const getStatusColor = (isCorrect: boolean | null) => {
    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return 'pending';
  };

  return (
    <div className="bg-brutalist-panel border-[3px] border-white/15">
      {picks.map((pick, index) => {
        const status = getStatusColor(pick.is_correct);
        const isRed = pick.picked_corner === 'red';
        const isBlue = pick.picked_corner === 'blue';

        return (
          <div
            key={pick.id}
            className={cn(
              "grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-6 p-6 border-b border-white/8 last:border-b-0",
              status === 'correct' && "bg-brutalist-success-dim border-l-[3px] border-l-green-500",
              status === 'incorrect' && "bg-brutalist-error-dim border-l-[3px] border-l-red-500",
              status === 'pending' && "bg-[rgba(255,193,7,0.1)] border-l-[3px] border-l-yellow-500"
            )}
          >
            {/* Event Info */}
            <div className="flex flex-col">
              <div className="text-sm text-white mb-1">{pick.event_name}</div>
              <div className="text-[0.65rem] text-gray-500">{formatDate(pick.event_date)}</div>
            </div>

            {/* Fight Info */}
            <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
              <span className={cn(
                "text-sm font-mono",
                isRed ? "text-red-500 font-bold" : "text-gray-500"
              )}>
                {pick.fighter_red || 'TBD'}
              </span>
              <span className="text-sm text-gray-500">VS</span>
              <span className={cn(
                "text-sm font-mono",
                isBlue ? "text-blue-500 font-bold" : "text-gray-500"
              )}>
                {pick.fighter_blue || 'TBD'}
              </span>
            </div>

            {/* Pick Details & Result */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-brutalist-elevated border border-white/15 px-3 py-1 text-[0.65rem] uppercase tracking-[1px]">
                  {pick.picked_method}
                </span>
                {pick.picked_round && (
                  <span className="bg-brutalist-elevated border border-white/15 px-3 py-1 text-[0.65rem] uppercase tracking-[1px]">
                    R{pick.picked_round}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {status === 'correct' && (
                  <>
                    <span className="text-sm font-bold uppercase text-green-500">✓ CORRECT</span>
                    <span className="font-bebas text-2xl text-green-500">+{pick.points_awarded} PTS</span>
                  </>
                )}
                {status === 'incorrect' && (
                  <>
                    <span className="text-sm font-bold uppercase text-red-500">✗ INCORRECT</span>
                    <span className="font-bebas text-2xl text-gray-500">0 PTS</span>
                  </>
                )}
                {status === 'pending' && (
                  <span className="text-sm font-bold uppercase text-yellow-500">⏱ PENDING</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
