'use client'

import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { Trophy } from "lucide-react";

interface LeaderboardRowProps {
  rank: number;
  username: string;
  avatarUrl?: string;
  points: number;
  accuracy: number;
  isCurrentUser?: boolean;
  className?: string;
}

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "text-yellow-400";
    case 2:
      return "text-gray-300";
    case 3:
      return "text-amber-600";
    default:
      return "text-muted-foreground";
  }
};

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function LeaderboardRow({
  rank,
  username,
  avatarUrl,
  points,
  accuracy,
  isCurrentUser,
  className,
}: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors",
        isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50",
        className
      )}
    >
      <div className={cn("w-8 text-center font-bold", getRankStyle(rank))}>
        {rank <= 3 ? (
          <Trophy className={cn("h-5 w-5 mx-auto", getRankStyle(rank))} />
        ) : (
          <span>#{rank}</span>
        )}
      </div>

      <UserAvatar src={avatarUrl} name={username} size="sm" />

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", isCurrentUser && "text-primary")}>
          {username}
          {isCurrentUser && <span className="text-xs ml-2 text-muted-foreground">(You)</span>}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-foreground">{formatNumber(points)}</p>
        <p className="text-xs text-muted-foreground">{accuracy}% accuracy</p>
      </div>
    </div>
  );
}
