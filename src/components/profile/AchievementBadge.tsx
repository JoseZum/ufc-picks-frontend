"use client";

import { cn } from "@/lib/utils";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        "bg-brutalist-panel border border-white/15 p-6 text-center transition-all duration-100",
        achievement.unlocked ? "opacity-100 border-brutalist-accent" : "opacity-40",
        "hover:scale-105"
      )}
    >
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <div className="text-[0.7rem] uppercase tracking-[1px] mb-1">
        {achievement.name}
      </div>
      <div className="text-[0.6rem] text-gray-500">
        {achievement.description}
      </div>
    </div>
  );
}
