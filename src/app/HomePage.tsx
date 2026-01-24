'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from "@/components/AppLayout"
import { CountdownTimer } from "@/components/CountdownTimer"
import { LeaderboardRow } from "@/components/LeaderboardRow"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Calendar, Flame, Target, Trophy, Loader2 } from "lucide-react"
import { useEvents, useGlobalLeaderboard, useEventBouts } from "@/lib/hooks"
import { getFighterImageUrl } from "@/lib/api"

export function HomePage() {
  // Obtener el próximo evento
  const { data: events, isLoading: eventsLoading } = useEvents({ 
    status: 'scheduled', 
    limit: 1 
  });
  const nextEvent = events?.[0];

  // Obtener las peleas del próximo evento para mostrar el main event
  const { data: bouts } = useEventBouts(nextEvent?.id || 0);
  const mainEventBout = bouts?.[0]; // La primera pelea es el main event

  // Obtener el top del leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useGlobalLeaderboard({ 
    limit: 5
  });
  const topUsers = leaderboard || [];
  const router = useRouter()

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl">UFC Picks</h1>
            <p className="text-xs text-muted-foreground">Compete. Predict. Win.</p>
          </div>
        </div>

        {/* Next Event Hero */}
        {eventsLoading ? (
          <Card className="card-gradient border-primary/30 p-6 relative overflow-hidden">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </Card>
        ) : nextEvent ? (
          <Card className="card-gradient border-primary/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Next Event</span>
                </div>
                <StatusBadge status={nextEvent.status === 'scheduled' ? "open" : "locked"} />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-1">{nextEvent.name}</h2>
              {mainEventBout && (
                <p className="text-primary font-semibold mb-2">
                  {mainEventBout.fighters.red?.fighter_name || 'TBD'} vs {mainEventBout.fighters.blue?.fighter_name || 'TBD'}
                </p>
              )}
              {nextEvent.location && (
                <p className="text-sm text-muted-foreground mb-4">
                  {nextEvent.location.city}, {nextEvent.location.country}
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center mb-4">
                Countdown to Event Start
              </p>
              <CountdownTimer targetDate={new Date(nextEvent.date)} />

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push(`/events/${nextEvent.id}`)}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Target className="h-4 w-4" />
                  Make Picks
                </Button>
                <Button
                  onClick={() => router.push("/leaderboards")}
                  variant="secondary"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Trophy className="h-4 w-4" />
                  View Leaderboard
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="card-gradient border-primary/30 p-6">
            <p className="text-center text-muted-foreground">No upcoming events</p>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-foreground">-</p>
            <p className="text-xs text-muted-foreground">Your Picks</p>
          </Card>
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-success">-</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </Card>
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-primary">-</p>
            <p className="text-xs text-muted-foreground">Your Rank</p>
          </Card>
        </div>

        {/* Mini Leaderboard */}
        <Card className="card-gradient p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Top Predictors</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/leaderboards")}
              className="text-primary"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-1">
              {topUsers.map((user) => (
                <LeaderboardRow
                  key={user.user_id}
                  rank={user.rank}
                  username={user.username}
                  avatarUrl={user.avatar_url}
                  points={user.total_points}
                  accuracy={Math.round(user.accuracy * 100)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
