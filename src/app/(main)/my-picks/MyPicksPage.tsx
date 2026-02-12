'use client'

import { useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Calendar, CheckCircle, XCircle, Clock, Trophy, AlertCircle } from "lucide-react";
import { useAllMyPicksDetailed } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { DetailedPick } from "@/lib/api";
import api from "@/lib/api";

// Calcula puntos desde los datos del pick y resultado
function computePoints(pick: DetailedPick): number {
  if (!pick.is_correct) return 0;

  let points = 1; // Acertó el ganador

  const pickMethod = pick.picked_method?.toUpperCase();
  const resultMethod = pick.result?.method?.toUpperCase();

  // Normalizar método del resultado
  const normalizeMethod = (m: string | undefined) => {
    if (!m) return "";
    const upper = m.toUpperCase();
    if (["KO", "TKO", "KO/TKO"].includes(upper)) return "KO/TKO";
    if (["SUB", "SUBMISSION"].includes(upper)) return "SUB";
    if (["DEC", "DECISION"].includes(upper)) return "DEC";
    return upper;
  };

  const normalizedPick = normalizeMethod(pickMethod);
  const normalizedResult = normalizeMethod(resultMethod);

  if (normalizedPick && normalizedResult && normalizedPick === normalizedResult) {
    points += 1; // Acertó el método

    // Round solo cuenta en finalizaciones (KO/TKO o SUB)
    if (normalizedPick !== "DEC" && pick.picked_round && pick.result?.round) {
      if (pick.picked_round === pick.result.round) {
        points += 1; // Acertó el round
      }
    }
  }

  return points;
}

export function MyPicksPage() {
  const queryClient = useQueryClient();
  const cleanupDone = useRef(false);
  const { data: picks, isLoading: picksLoading, error: picksError } = useAllMyPicksDetailed();

  // Limpiar picks pendientes de eventos completados al entrar
  useEffect(() => {
    if (!api.isAuthenticated() || cleanupDone.current) return;
    cleanupDone.current = true;

    api.cleanupPendingPicks().then((res) => {
      if (res.deleted > 0) {
        // Refrescar picks si se eliminó algo
        queryClient.invalidateQueries({ queryKey: ['allMyPicksDetailed'] });
      }
    }).catch(() => {
      // Silenciar errores del cleanup
    });
  }, [queryClient]);

  const isLoading = picksLoading;
  const isAuthenticated = api.isAuthenticated();

  // Agrupa picks por evento: pending vs completed
  const picksByEvent = useMemo(() => {
    if (!picks) return { pending: [], completed: [] };

    const grouped: Record<number, { eventName: string; eventDate: string; picks: DetailedPick[] }> = {};

    for (const pick of picks) {
      if (!grouped[pick.event_id]) {
        grouped[pick.event_id] = {
          eventName: pick.event_name || `Event ${pick.event_id}`,
          eventDate: pick.event_date || '',
          picks: []
        };
      }
      grouped[pick.event_id].picks.push(pick);
    }

    const entries = Object.entries(grouped).map(([eventId, data]) => ({
      eventId: Number(eventId),
      ...data
    }));
    
    // Separar por si los picks ya tienen resultado
    const pending = entries.filter(e =>
      e.picks.some(p => p.is_correct === null || p.is_correct === undefined)
    );
    const completed = entries.filter(e =>
      e.picks.every(p => p.is_correct !== null && p.is_correct !== undefined)
    );

    // Ordenar: pending por próximos primero, completed por recientes primero
    pending.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    completed.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    return { pending, completed };
  }, [picks]);

  // Calcula estadísticas generales del usuario
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
        const pts = computePoints(pick);
        totalPoints += pts;
        if (pick.is_correct) {
          correct++;
          if (pts === 3) {
            perfect3Pointers++;
          }
        } else {
          incorrect++;
        }
      }
    }

    return { correct, incorrect, pending, total: picks.length, totalPoints, perfect3Pointers };
  }, [picks]);

  // Sin autenticación
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mis Picks</h1>
        </div>
        <Card className="card-gradient p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Inicia sesión para ver tus picks</h2>
          <p className="text-muted-foreground">
            Crea una cuenta o inicia sesión para empezar a hacer predicciones
          </p>
        </Card>
      </div>
    );
  }

  // Cargando
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mis Picks</h1>
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

  // Error al cargar
  if (picksError) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mis Picks</h1>
        </div>
        <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Error al cargar tus picks. Intenta más tarde.</span>
        </div>
      </div>
    );
  }

  // Formatea fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mis Picks</h1>
      </div>

      {/* Estadísticas */}
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

      {/* Sin picks aún */}
      {picks?.length === 0 && (
        <Card className="card-gradient p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Sin picks aún</h2>
          <p className="text-muted-foreground">
            ¡Ve a un evento próximo y haz tus predicciones!
          </p>
        </Card>
      )}

      {/* Picks Pendientes */}
      {picksByEvent.pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Esperando Resultados ({picksByEvent.pending.reduce((acc, e) => acc + e.picks.length, 0)})
          </h2>
          {picksByEvent.pending.map(({ eventId, eventName, eventDate, picks: eventPicks }) => (
            <div key={eventId} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{eventName}</span>
                <span className="text-sm text-muted-foreground">• {formatDate(eventDate)}</span>
              </div>
              <div className="space-y-3">
                {eventPicks.map((pick) => {
                  const pickedFighter = pick.picked_fighter_name;
                  const isPickedRed = pick.picked_fighter_name?.toLowerCase() === pick.fighter_red?.toLowerCase();
                  const opponentFighter = isPickedRed ? pick.fighter_blue : pick.fighter_red;

                  return (
                    <Card key={pick.id} className="card-gradient p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-1">{pick.weight_class || 'Fight'}</p>
                          <p className="font-medium mb-1">
                            <span className={isPickedRed ? 'text-fighter-red' : 'text-fighter-blue'}>
                              {pickedFighter || 'Fighter'}
                            </span>
                            {' vs '}
                            <span className="text-muted-foreground">{opponentFighter || 'Opponent'}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pick: {pick.picked_method}{pick.picked_round ? ` R${pick.picked_round}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-warning" />
                          </div>
                          <span className="text-xs text-warning font-medium">Pendiente</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Picks Completados */}
      {picksByEvent.completed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-success" />
            Resultados Pasados ({picksByEvent.completed.reduce((acc, e) => acc + e.picks.length, 0)})
          </h2>
          {picksByEvent.completed.map(({ eventId, eventName, eventDate, picks: eventPicks }) => {
            const eventCorrect = eventPicks.filter(p => p.is_correct).length;
            const eventTotal = eventPicks.length;
            const eventAccuracy = eventTotal > 0 ? Math.round((eventCorrect / eventTotal) * 100) : 0;
            const eventPoints = eventPicks.reduce((sum, p) => sum + computePoints(p), 0);
            
            return (
              <div key={eventId} className="mb-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{eventName}</span>
                  <span className="text-sm text-muted-foreground">• {formatDate(eventDate)}</span>
                  <span className="ml-auto flex items-center gap-2 text-sm">
                    <span className="font-medium">{eventCorrect}/{eventTotal}</span>
                    <span className="text-muted-foreground">({eventAccuracy}%)</span>
                    <span className="text-primary font-bold">+{eventPoints} pts</span>
                  </span>
                </div>
                <div className="space-y-3">
                  {eventPicks.map((pick) => {
                    const pickedFighter = pick.picked_fighter_name;
                    const isPickedRed = pick.picked_fighter_name?.toLowerCase() === pick.fighter_red?.toLowerCase();
                    const opponentFighter = isPickedRed ? pick.fighter_blue : pick.fighter_red;
                    const pts = computePoints(pick);

                    return (
                      <Card key={pick.id} className={`card-gradient p-4 ${pick.is_correct ? 'border-success/30' : 'border-destructive/30'}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground mb-1">{pick.weight_class || 'Fight'}</p>
                            <p className="font-medium mb-1">
                              <span className={isPickedRed ? 'text-fighter-red' : 'text-fighter-blue'}>
                                {pickedFighter || 'Fighter'}
                              </span>
                              {' vs '}
                              <span className="text-muted-foreground">{opponentFighter || 'Opponent'}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Pick: {pick.picked_method}{pick.picked_round ? ` R${pick.picked_round}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {pick.is_correct ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-success">+{pts}</span>
                                  <CheckCircle className="h-5 w-5 text-success" />
                                </div>
                                <span className="text-xs text-success font-medium">
                                  {pts === 3 ? (
                                    <span className="flex items-center gap-1 text-ufc-gold">
                                      <Trophy className="h-3 w-3" />
                                      PERFECT
                                    </span>
                                  ) : pts === 2 ? (
                                    'Peleador + Método'
                                  ) : (
                                    'Peleador'
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-destructive">0</span>
                                  <XCircle className="h-5 w-5 text-destructive" />
                                </div>
                                <span className="text-xs text-destructive font-medium">Pick Incorrecto</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
