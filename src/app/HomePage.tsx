'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from "@/components/AppLayout"
import { CountdownTimer } from "@/components/CountdownTimer"
import { LeaderboardRow } from "@/components/LeaderboardRow"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Calendar, Flame, Target, Trophy, Loader2 } from "lucide-react"
import { useEvents, useGlobalLeaderboard, useEventBouts, useCurrentUser, useMyLeaderboardPosition } from "@/lib/hooks"
import { getFighterImageUrl, getEventPosterUrl } from "@/lib/api"

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

  // Obtener datos del usuario actual
  const { data: currentUser } = useCurrentUser();
  const { data: myPosition } = useMyLeaderboardPosition('global');

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
          <Card className="card-gradient border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

            {/* Event Poster Banner */}
            <div className="relative h-48 md:h-64 overflow-hidden">
              <img
                src={getEventPosterUrl(nextEvent)}
                alt={nextEvent.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

              {/* Badge overlay */}
              <div className="absolute top-4 right-4">
                <StatusBadge status={nextEvent.status === 'scheduled' ? "open" : "locked"} />
              </div>

              {/* Date badge */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {new Date(nextEvent.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative p-6 -mt-12">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Next Event</span>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">{nextEvent.name}</h2>

              {/* Main Event Fighters */}
              {mainEventBout && (
                <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Main Event</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-right flex-1">
                      <p className="font-bold text-foreground">{mainEventBout.fighters.red?.fighter_name || 'TBD'}</p>
                      {mainEventBout.fighters.red?.record_at_fight && (
                        <p className="text-xs text-muted-foreground">
                          {mainEventBout.fighters.red.record_at_fight.wins}-{mainEventBout.fighters.red.record_at_fight.losses}-{mainEventBout.fighters.red.record_at_fight.draws}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-primary font-bold text-lg">VS</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-foreground">{mainEventBout.fighters.blue?.fighter_name || 'TBD'}</p>
                      {mainEventBout.fighters.blue?.record_at_fight && (
                        <p className="text-xs text-muted-foreground">
                          {mainEventBout.fighters.blue.record_at_fight.wins}-{mainEventBout.fighters.blue.record_at_fight.losses}-{mainEventBout.fighters.blue.record_at_fight.draws}
                        </p>
                      )}
                    </div>
                  </div>
                  {mainEventBout.weight_class && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {mainEventBout.weight_class} {mainEventBout.is_title_fight && '- Title Fight'}
                    </p>
                  )}
                </div>
              )}

              {nextEvent.location && (
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {[nextEvent.location.venue, nextEvent.location.city, nextEvent.location.country].filter(Boolean).join(', ')}
                </p>
              )}

              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
                  Countdown to Event
                </p>
                <CountdownTimer targetDate={new Date(nextEvent.date)} />
              </div>

              {/* Event Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{nextEvent.total_bouts}</p>
                  <p className="text-xs text-muted-foreground">Total Fights</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">
                    {bouts?.filter(b => b.is_title_fight).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Title Fights</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
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
            <p className="text-2xl font-bold text-foreground">
              {currentUser?.picks_total || 0}
            </p>
            <p className="text-xs text-muted-foreground">Your Picks</p>
          </Card>
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {currentUser?.accuracy ? `${Math.round(currentUser.accuracy * 100)}%` : '0%'}
            </p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </Card>
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {myPosition?.rank ? `#${myPosition.rank}` : '-'}
            </p>
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
                  userId={user.user_id}
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
