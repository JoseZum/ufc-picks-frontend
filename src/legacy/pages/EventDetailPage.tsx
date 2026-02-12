'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BoutCard } from "@/components/BoutCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, MapPin, Clock, AlertCircle, Lock, Unlock } from "lucide-react";
import { useEvent, useEventBouts, useMyPicks, useCreatePick, useCurrentUser } from "@/lib/hooks";
import type { Bout } from "@/lib/api";
import api, { getFighterImageUrl, getEventPosterUrl, getApiUrl } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

// Formatea fecha con hora y zona horaria
function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' • ' + date.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// Formatea la ubicación del evento
function formatLocation(location?: { venue?: string; city?: string; country?: string }): string {
  if (!location) return 'Por confirmar';
  const parts = [location.venue, location.city, location.country].filter(Boolean);
  return parts.join(', ') || 'Por confirmar';
}

interface TransformedBout {
  order: number;
  boutId: number;
  fightId: string;
  fighterRed: string;
  fighterBlue: string;
  imageUrlRed?: string;
  imageUrlBlue?: string;
  weightClass: string;
  rounds: number;
  isMainEvent: boolean;
  isCoMain: boolean;
  isTitleFight: boolean;
  winner?: "red" | "blue";
  actualMethod?: string;
  actualRound?: number;
}

// Transforma datos del bout para mostrarlos
function transformBout(bout: Bout, index: number): TransformedBout {
  const redFighter = bout.fighters.red;
  const blueFighter = bout.fighters.blue;

  return {
    order: index + 1,
    boutId: bout.id,
    fightId: String(bout.id),
    fighterRed: redFighter?.fighter_name || 'Por confirmar',
    fighterBlue: blueFighter?.fighter_name || 'Por confirmar',
    imageUrlRed: redFighter ? getFighterImageUrl(redFighter) : undefined,
    imageUrlBlue: blueFighter ? getFighterImageUrl(blueFighter) : undefined,
    weightClass: bout.weight_class,
    rounds: bout.rounds_scheduled,
    isMainEvent: index === 0,
    isCoMain: index === 1,
    isTitleFight: bout.is_title_fight,
    winner: bout.result?.winner as "red" | "blue" | undefined,
    actualMethod: bout.result?.method,
    actualRound: bout.result?.round,
  };
}

// Calcula puntos basado en pick y resultado de la pelea
function computePickPoints(pick: { picked_fighter_name: string; picked_method?: string; picked_round?: number; is_correct?: boolean | null }, bout: TransformedBout): number {
  if (!pick.is_correct) return 0;

  let points = 1;

  const normalize = (m: string | undefined) => {
    if (!m) return "";
    const u = m.toUpperCase();
    if (["KO", "TKO", "KO/TKO"].includes(u)) return "KO/TKO";
    if (["SUB", "SUBMISSION"].includes(u)) return "SUB";
    if (["DEC", "DECISION"].includes(u)) return "DEC";
    return u;
  };

  const pickMethod = normalize(pick.picked_method);
  const resultMethod = normalize(bout.actualMethod);

  if (pickMethod && resultMethod && pickMethod === resultMethod) {
    points += 1;
    if (pickMethod !== "DEC" && pick.picked_round && bout.actualRound) {
      if (pick.picked_round === bout.actualRound) {
        points += 1;
      }
    }
  }

  return points;
}

export function EventDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [localPicks, setLocalPicks] = useState<Record<number, { fighter: "red" | "blue" }>>({});

  // Parse event ID as number for API calls
  const eventId = parseInt(id, 10);

  // Fetch event and bouts from API
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const { data: bouts, isLoading: boutsLoading, error: boutsError } = useEventBouts(eventId);
  const { data: existingPicks } = useMyPicks(eventId);
  const { data: currentUser } = useCurrentUser();
  const createPickMutation = useCreatePick();

  // Pick locks (backend-driven now)
  const eventPicksLocked = event?.picks_locked || false;
  const queryClient = useQueryClient();

  const isLoading = eventLoading || boutsLoading;
  const error = eventError || boutsError;
  const isAuthenticated = api.isAuthenticated();
  const isAdmin = currentUser?.is_admin || false;

  // Maneja el bloqueo del evento
  const handleToggleEventLock = async () => {
    try {
      if (eventPicksLocked) {
        await api.unlockEventPicks(eventId);
      } else {
        await api.lockEventPicks(eventId);
      }
      // Refrescar datos
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      await queryClient.refetchQueries({ queryKey: ['event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['bouts', eventId] });
      await queryClient.refetchQueries({ queryKey: ['bouts', eventId] });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Maneja el bloqueo individual de una pelea
  const handleToggleBoutLock = async (boutId: number) => {
    try {
      const bout = bouts?.find(b => b.id === boutId);
      if (bout?.picks_locked) {
        await api.unlockBoutPicks(boutId);
      } else {
        await api.lockBoutPicks(boutId);
      }
      // Invalidate and refetch queries to update UI immediately
      await queryClient.invalidateQueries({ queryKey: ['bouts', eventId] });
      await queryClient.refetchQueries({ queryKey: ['bouts', eventId] });
    } catch (error) {
      console.error('Error toggling bout lock:', error);
    }
  };

  const handleMakePick = (boutId: number, order: number, fighter: "red" | "blue") => {
    setLocalPicks((prev) => ({
      ...prev,
      [order]: { fighter },
    }));
  };

  // Cargando
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Eventos
        </Button>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error al cargar
  if (error || !event) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/events")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Eventos
        </Button>
        <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Error al cargar el evento. Intenta más tarde.</span>
        </div>
      </div>
    );
  }

  // Transforma los bouts para mostrarlos
  const transformedBouts = (bouts || []).map((bout, index) => transformBout(bout, index));

  // Mapa de picks por bout_id para acceso rápido
  const picksMap = (existingPicks || []).reduce((acc, pick) => {
    acc[pick.bout_id] = pick;
    return acc;
  }, {} as Record<number, typeof existingPicks[0]>);

  // Divide en main card (primeras 5) y preliminares (resto)
  const mainCardBouts = transformedBouts.slice(0, 5);
  const prelimBouts = transformedBouts.slice(5);

  const totalBouts = transformedBouts.length;
  const picksCount = Object.keys(localPicks).length;
  const picksOpen = event.status === 'scheduled';
  const eventDate = new Date(event.date);

  // Datos de la pelea principal para el subtítulo
  const mainEvent = transformedBouts[0];
  const subtitle = mainEvent ? `${mainEvent.fighterRed} vs ${mainEvent.fighterBlue}` : '';

  const CardSection = ({
    title,
    emoji,
    bouts: boutsToRender,
    apiBouts,
  }: {
    title: string;
    emoji: string;
    bouts: TransformedBout[];
    apiBouts: Bout[] | undefined;
  }) => (
    <section>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h3>
      <div className="space-y-3">
        {boutsToRender.map((bout) => {
          const pick = picksMap[bout.boutId];
          const pickStatus = pick?.is_correct === true ? "correct" :
                            pick?.is_correct === false ? "incorrect" :
                            "pending";

          // Verifica si la pelea está bloqueada
          const boutFromApi = apiBouts?.find(b => b.id === bout.boutId);
          const boutLockedByAdmin = boutFromApi?.picks_locked || false;
          const isLockedFinal = !picksOpen || boutLockedByAdmin || eventPicksLocked;

          // Convierte nombre del peleador a corner para BoutCard
          const pickedCorner = pick?.picked_fighter_name
            ? (pick.picked_fighter_name.toLowerCase().trim() === bout.fighterRed?.toLowerCase().trim() ? 'red' : 'blue')
            : undefined;

          return (
            <BoutCard
              key={bout.order}
              order={bout.order}
              fighterRed={bout.fighterRed}
              fighterBlue={bout.fighterBlue}
              imageUrlRed={bout.imageUrlRed}
              imageUrlBlue={bout.imageUrlBlue}
              weightClass={bout.weightClass}
              rounds={bout.rounds}
              isMainEvent={bout.isMainEvent}
              isCoMain={bout.isCoMain}
              cardSection="main"
              selectedFighter={pickedCorner || localPicks[bout.order]?.fighter}
              selectedMethod={pick?.picked_method}
              selectedRound={pick?.picked_round as 1 | 2 | 3 | 4 | 5 | undefined}
              winner={bout.winner}
              actualMethod={bout.actualMethod}
              actualRound={bout.actualRound as 1 | 2 | 3 | 4 | 5 | undefined}
              points={pick?.is_correct !== null && pick?.is_correct !== undefined ? computePickPoints(pick, bout) as 0 | 1 | 2 | 3 : undefined}
              pickStatus={pick ? pickStatus : undefined}
              isLocked={isLockedFinal}
              eventId={String(eventId)}
              fightId={bout.fightId}
              onMakePick={(fighter) => handleMakePick(bout.boutId, bout.order, fighter)}
              // Admin controls
              isAdmin={isAdmin}
              onToggleLock={() => handleToggleBoutLock(bout.boutId)}
            />
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Botón atrás */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/events")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Eventos
      </Button>

      {/* Encabezado del evento */}
      <Card className="card-gradient p-6 border-primary/30">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Event Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-40 h-56 md:w-48 md:h-64 rounded-lg overflow-hidden bg-secondary/50 border border-border">
              <img
                src={getEventPosterUrl(event)}
                alt={event.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-event.svg';
                }}
              />
            </div>
          </div>

          {/* Event Info */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <p className="text-primary font-semibold">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={picksOpen ? "open" : "locked"} />
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleEventLock}
                    className="flex items-center gap-2"
                  >
                    {eventPicksLocked ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Desbloquear Evento
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4" />
                        Bloquear Evento
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDisplayDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{formatLocation(event.location)}</span>
              </div>
            </div>

            {picksOpen && (
              <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Los picks se bloquean cuando comienza el evento
                </p>
                <CountdownTimer targetDate={eventDate} />
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {picksCount} de {totalBouts} picks hechos
              </span>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${totalBouts > 0 ? (picksCount / totalBouts) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tarjetas de pele as */}
      {mainCardBouts.length > 0 && (
        <CardSection title="Cartelera Principal" emoji="🔥" bouts={mainCardBouts} apiBouts={bouts} />
      )}
      {prelimBouts.length > 0 && (
        <CardSection title="Preliminares" emoji="🟡" bouts={prelimBouts} apiBouts={bouts} />
      )}

      {/* Sin pele as aún */}
      {transformedBouts.length === 0 && (
        <Card className="card-gradient p-8 text-center">
          <p className="text-muted-foreground">Sin pele as anunciadas aún para este evento.</p>
        </Card>
      )}

      {/* Botón flotante para guardar */}
      {picksOpen && picksCount > 0 && isAuthenticated && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4 md:left-64">
          <div className="container max-w-4xl">
            <Button size="lg" className="w-full shadow-lg">
              Guardar {picksCount} Pick{picksCount > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* Aviso para iniciar sesión */}
      {picksOpen && !isAuthenticated && (
        <Card className="card-gradient p-4 text-center">
          <p className="text-muted-foreground mb-3">Inicia sesión para hacer tus picks</p>
          <Button onClick={() => router.push("/auth")}>Iniciar Sesión</Button>
        </Card>
      )}
    </div>
  );
}
