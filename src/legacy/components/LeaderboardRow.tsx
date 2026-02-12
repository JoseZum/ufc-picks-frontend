'use client'

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { Trophy, ChevronRight } from "lucide-react";

interface LeaderboardRowProps {
  rank: number;
  userId: string;
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
  userId,
  username,
  avatarUrl,
  points,
  accuracy,
  isCurrentUser,
  className,
}: LeaderboardRowProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/users/${userId}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group",
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
        <p className={cn("font-medium truncate group-hover:text-primary transition-colors", isCurrentUser && "text-primary")}>
          {username}
          {isCurrentUser && <span className="text-xs ml-2 text-muted-foreground">(You)</span>}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-foreground">{formatNumber(points)}</p>
        <p className="text-xs text-muted-foreground">{accuracy}% accuracy</p>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
