'use client'

import { useMemo } from "react";
import { BoutCard } from "@/components/BoutCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Calendar, CheckCircle, XCircle, Clock, Trophy, AlertCircle } from "lucide-react";
import { useAllMyPicks, useEvents } from "@/lib/hooks";
import type { Pick, Event, Bout } from "@/lib/api";
import api from "@/lib/api";

export function MyPicksPage() {
  const { data: picks, isLoading: picksLoading, error: picksError } = useAllMyPicks();
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 50 });

  const isLoading = picksLoading || eventsLoading;
  const isAuthenticated = api.isAuthenticated();

  // Group picks by event - separate by whether results are in (is_correct is not null)
  const picksByEvent = useMemo(() => {
    if (!picks || !eventsData?.events) return { pending: [], completed: [] };

    const eventsMap = new Map(eventsData.events.map(e => [e.id, e]));
    const grouped: Record<number, { event: Event; picks: Pick[] }> = {};

    for (const pick of picks) {
      const event = eventsMap.get(pick.event_id);
      if (!event) continue;

      if (!grouped[pick.event_id]) {
        grouped[pick.event_id] = { event, picks: [] };
      }
      grouped[pick.event_id].picks.push(pick);
    }

    const entries = Object.values(grouped);
    
    // Separate by whether picks have results (is_correct is not null/undefined)
    // A pick is "completed" if is_correct has been set (true or false)
    const pending = entries.filter(e => 
      e.picks.some(p => p.is_correct === null || p.is_correct === undefined)
    );
    const completed = entries.filter(e => 
      e.picks.every(p => p.is_correct !== null && p.is_correct !== undefined)
    );

    // Sort by date: pending shows upcoming first, completed shows recent first
    pending.sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
    completed.sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());

    return { pending, completed };
  }, [picks, eventsData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!picks) return { correct: 0, incorrect: 0, pending: 0, total: 0, totalPoints: 0, perfect3Pointers: 0 };

    let correct = 0;
    let incorrect = 0;
    let pending = 0;
    let totalPoints = 0;
    let perfect3Pointers = 0;

    for (const pick of picks) {
      if (pick.is_correct === null || pick.is_correct === undefined) {
        pending++;
      } else {
        totalPoints += pick.points_awarded;
        if (pick.is_correct) {
          correct++;
          if (pick.points_awarded === 3) {
            perfect3Pointers++;
          }
        } else {
          incorrect++;
        }
      }
    }

    return { correct, incorrect, pending, total: picks.length, totalPoints, perfect3Pointers };
  }, [picks]);

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Picks</h1>
        </div>
        <Card className="card-gradient p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Sign in to see your picks</h2>
          <p className="text-muted-foreground">
            Create an account or sign in to start making predictions
          </p>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Picks</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (picksError) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Picks</h1>
        </div>
        <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load picks. Please try again later.</span>
        </div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">My Picks</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="card-gradient p-3 text-center">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Picks</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalPoints}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-xl font-bold text-success">{stats.correct}</p>
          </div>
          <p className="text-xs text-muted-foreground">Correct</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <XCircle className="h-4 w-4 text-destructive" />
            <p className="text-xl font-bold text-destructive">{stats.incorrect}</p>
          </div>
          <p className="text-xs text-muted-foreground">Incorrect</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="h-4 w-4 text-ufc-gold" />
            <p className="text-xl font-bold text-ufc-gold">{stats.perfect3Pointers}</p>
          </div>
          <p className="text-xs text-muted-foreground">Perfect (3pts)</p>
        </Card>
      </div>

      {/* Empty state */}
      {picks?.length === 0 && (
        <Card className="card-gradient p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No picks yet</h2>
          <p className="text-muted-foreground">
            Go to an upcoming event and make your predictions!
          </p>
        </Card>
      )}

      {/* Pending Picks */}
      {picksByEvent.pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Awaiting Results ({picksByEvent.pending.reduce((acc, e) => acc + e.picks.length, 0)})
          </h2>
          {picksByEvent.pending.map(({ event, picks: eventPicks }) => (
            <div key={event.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{event.name}</span>
                <span className="text-sm text-muted-foreground">• {formatDate(event.date)}</span>
              </div>
              <div className="space-y-3">
                {eventPicks.map((pick) => (
                  <Card key={pick.id} className="card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Bout #{pick.bout_id}</p>
                        <p className="font-medium">
                          Picked: <span className={pick.picked_corner === 'red' ? 'text-fighter-red' : 'text-fighter-blue'}>
                            {pick.picked_corner.toUpperCase()} corner
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pick.picked_method}{pick.picked_round ? ` in R${pick.picked_round}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <Clock className="h-5 w-5 text-warning" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Completed Picks */}
      {picksByEvent.completed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-success" />
            Past Results ({picksByEvent.completed.reduce((acc, e) => acc + e.picks.length, 0)})
          </h2>
          {picksByEvent.completed.map(({ event, picks: eventPicks }) => {
            const eventCorrect = eventPicks.filter(p => p.is_correct).length;
            const eventTotal = eventPicks.length;
            const eventAccuracy = eventTotal > 0 ? Math.round((eventCorrect / eventTotal) * 100) : 0;
            const eventPoints = eventPicks.reduce((sum, p) => sum + (p.points_awarded || 0), 0);
            
            return (
              <div key={event.id} className="mb-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{event.name}</span>
                  <span className="text-sm text-muted-foreground">• {formatDate(event.date)}</span>
                  <span className="ml-auto flex items-center gap-2 text-sm">
                    <span className="font-medium">{eventCorrect}/{eventTotal}</span>
                    <span className="text-muted-foreground">({eventAccuracy}%)</span>
                    <span className="text-primary font-bold">+{eventPoints} pts</span>
                  </span>
                </div>
                <div className="space-y-3">
                  {eventPicks.map((pick) => (
                    <Card key={pick.id} className={`card-gradient p-4 ${pick.is_correct ? 'border-success/30' : 'border-destructive/30'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Bout #{pick.bout_id}</p>
                          <p className="font-medium">
                            Picked: <span className={pick.picked_corner === 'red' ? 'text-fighter-red' : 'text-fighter-blue'}>
                              {pick.picked_corner.toUpperCase()} corner
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pick.picked_method}{pick.picked_round ? ` in R${pick.picked_round}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          {pick.is_correct ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-success">+{pick.points_awarded}</span>
                                <CheckCircle className="h-5 w-5 text-success" />
                              </div>
                              {pick.points_awarded === 3 && (
                                <span className="text-xs text-ufc-gold font-semibold flex items-center gap-1">
                                  <Trophy className="h-3 w-3" />
                                  PERFECT
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">0 pts</span>
                              <XCircle className="h-5 w-5 text-destructive" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
