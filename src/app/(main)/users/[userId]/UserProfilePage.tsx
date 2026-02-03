"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile, useUserPicks, useUserPicksStats, useEvents } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trophy, Target, Percent, Check, X, Clock, Filter } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

interface UserProfilePageProps {
  userId: string;
}

type StatusFilter = "all" | "correct" | "incorrect" | "pending";

export function UserProfilePage({ userId }: UserProfilePageProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const { data: profile, isLoading: profileLoading, error: profileError } = useUserProfile(userId);
  const { data: stats, isLoading: statsLoading } = useUserPicksStats(userId, selectedYear);
  const { data: picks, isLoading: picksLoading } = useUserPicks(userId, {
    event_id: selectedEvent,
    year: selectedYear,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });
  const { data: eventsData } = useEvents({ limit: 50 });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const events = eventsData?.events || [];
  const years = [...new Set(events.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="space-y-6 pb-20">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">User Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="card-gradient border-border/50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <UserAvatar
            src={profile.avatar_url}
            name={profile.name}
            className="h-20 w-20 text-2xl"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-foreground">{profile.total_points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{profile.picks_total}</p>
            <p className="text-xs text-muted-foreground">Total Picks</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <Check className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{profile.picks_correct}</p>
            <p className="text-xs text-muted-foreground">Correct Picks</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <Percent className="h-5 w-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{profile.accuracy.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
        </div>
      </Card>

      {/* Detailed Stats */}
      {stats && (
        <Card className="card-gradient border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Pick Statistics
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_method.DEC}</p>
              <p className="text-xs text-muted-foreground">Decision Picks</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_method['KO/TKO']}</p>
              <p className="text-xs text-muted-foreground">KO/TKO Picks</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.by_method.SUB}</p>
              <p className="text-xs text-muted-foreground">Submission Picks</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Perfect Picks (3 pts):</span>
            <span className="font-bold text-primary">{stats.perfect_picks}</span>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-gradient border-border/50 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Year Filter */}
          <select
            className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border"
            value={selectedYear || ""}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Event Filter */}
          <select
            className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border flex-1 min-w-[200px]"
            value={selectedEvent || ""}
            onChange={(e) => setSelectedEvent(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex gap-1">
            {(["all", "correct", "incorrect", "pending"] as StatusFilter[]).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status === "correct" && <Check className="h-3 w-3 mr-1" />}
                {status === "incorrect" && <X className="h-3 w-3 mr-1" />}
                {status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Picks List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Picks History</h3>

        {picksLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !picks || picks.length === 0 ? (
          <Card className="card-gradient border-border/50 p-6 text-center">
            <p className="text-muted-foreground">No picks found with current filters</p>
          </Card>
        ) : (
          picks.map(pick => (
            <Card
              key={pick.id}
              className={cn(
                "card-gradient border-border/50 p-4 cursor-pointer transition-all hover:border-primary/50",
                pick.is_correct === true && "border-l-4 border-l-green-500",
                pick.is_correct === false && "border-l-4 border-l-red-500",
                pick.is_correct === null && "border-l-4 border-l-yellow-500"
              )}
              onClick={() => router.push(`/events/${pick.event_id}`)}
            >
              {/* Event Info */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{pick.event_name}</p>
                  <p className="text-xs text-muted-foreground">{pick.event_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pick.is_correct === true && (
                    <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-medium">
                      +{pick.points_awarded} pts
                    </span>
                  )}
                  {pick.is_correct === false && (
                    <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-medium">
                      Incorrect
                    </span>
                  )}
                  {pick.is_correct === null && (
                    <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Fight Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-medium",
                    pick.picked_corner === "red" ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {pick.fighter_red || 'TBD'}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={cn(
                    "font-medium",
                    pick.picked_corner === "blue" ? "text-blue-400" : "text-muted-foreground"
                  )}>
                    {pick.fighter_blue || 'TBD'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{pick.weight_class}</p>
                </div>
              </div>

              {/* Pick Details */}
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Picked: <span className={cn(
                      "font-medium",
                      pick.picked_corner === "red" ? "text-red-400" : "text-blue-400"
                    )}>
                      {pick.picked_corner === "red" ? pick.fighter_red : pick.fighter_blue}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    via <span className="font-medium text-foreground">{pick.picked_method}</span>
                    {pick.picked_round && ` R${pick.picked_round}`}
                  </span>
                </div>

                {/* Actual Result if available */}
                {pick.result && (
                  <div className="text-xs text-muted-foreground">
                    Result: {pick.result.winner === "red" ? pick.fighter_red : pick.fighter_blue} via {pick.result.method}
                    {pick.result.round && ` R${pick.result.round}`}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
