'use client'

import { useState } from "react"
import { Lock, Unlock, Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { useEvents, useEventBouts } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/api"

export function BoutLockManager() {
  const { data: eventsData, isLoading, refetch } = useEvents({ limit: 20 })
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null)
  const [lockingEvent, setLockingEvent] = useState<number | null>(null)

  const handleLockEvent = async (eventId: number, lock: boolean) => {
    setLockingEvent(eventId)

    try {
      const token = getAuthToken()
      const endpoint = lock ? 'lock-picks' : 'unlock-picks'
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al actualizar evento")
      }

      toast.success(lock ? "Evento lockeado correctamente" : "Evento desbloqueado correctamente")
      refetch()
    } catch (error: any) {
      console.error("Error updating event lock:", error)
      toast.error(error.message || "Error al actualizar evento")
    } finally {
      setLockingEvent(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const events = eventsData?.events || []

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Lockea o desbloquea picks para eventos completos o peleas individuales.
      </p>

      {events.map((event) => (
        <EventLockCard
          key={event.id}
          event={event}
          expanded={expandedEvent === event.id}
          onToggle={() =>
            setExpandedEvent(expandedEvent === event.id ? null : event.id)
          }
          onLockEvent={handleLockEvent}
          locking={lockingEvent === event.id}
          refetchEvents={refetch}
        />
      ))}
    </div>
  )
}

function EventLockCard({
  event,
  expanded,
  onToggle,
  onLockEvent,
  locking,
  refetchEvents,
}: {
  event: any
  expanded: boolean
  onToggle: () => void
  onLockEvent: (eventId: number, lock: boolean) => void
  locking: boolean
  refetchEvents: () => void
}) {
  const isLocked = event.picks_locked === true

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Sin fecha"
    const date = new Date(dateStr)
    return date.toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <Card className="card-gradient">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/5 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{event.name}</h3>
            <Badge variant={isLocked ? "destructive" : "secondary"} className="text-xs">
              {isLocked ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  LOCKEADO
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  ABIERTO
                </>
              )}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {formatDate(event.date)} - {event.total_bouts || 0} peleas
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t border-border/50 space-y-4">
          {/* Event Lock Controls */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Lockeo de Evento Completo
            </div>
            <p className="text-xs text-muted-foreground">
              {isLocked
                ? "El evento está lockeado. Los usuarios no pueden hacer picks para ninguna pelea."
                : "El evento está abierto. Los usuarios pueden hacer picks para las peleas."}
            </p>
            <Button
              onClick={() => onLockEvent(event.id, !isLocked)}
              disabled={locking}
              variant={isLocked ? "default" : "destructive"}
              className="w-full"
            >
              {locking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : isLocked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Desbloquear Evento
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lockear Evento
                </>
              )}
            </Button>
          </div>

          {/* Individual Bouts */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Peleas Individuales</h4>
            <BoutsList eventId={event.id} refetchEvents={refetchEvents} />
          </div>
        </div>
      )}
    </Card>
  )
}

function BoutsList({ eventId, refetchEvents }: { eventId: number; refetchEvents: () => void }) {
  const { data: bouts, isLoading, refetch } = useEventBouts(eventId)
  const [lockingBout, setLockingBout] = useState<number | null>(null)

  const handleLockBout = async (boutId: number, lock: boolean) => {
    setLockingBout(boutId)

    try {
      const token = getAuthToken()
      const endpoint = lock ? 'lock-picks' : 'unlock-picks'
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bouts/${boutId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al actualizar pelea")
      }

      toast.success(lock ? "Pelea lockeada" : "Pelea desbloqueada")
      refetch()
    } catch (error: any) {
      console.error("Error updating bout lock:", error)
      toast.error(error.message || "Error al actualizar pelea")
    } finally {
      setLockingBout(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  if (!bouts || bouts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No hay peleas para este evento.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {bouts.map((bout: any) => {
        const isLocked = bout.picks_locked === true
        const hasResult = bout.result !== null
        const redFighter = bout.fighters?.red?.fighter_name || 'TBD'
        const blueFighter = bout.fighters?.blue?.fighter_name || 'TBD'

        return (
          <div
            key={bout.id}
            className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {redFighter} vs {blueFighter}
                </span>
                {bout.is_title_fight && (
                  <Badge variant="outline" className="text-xs">
                    TITLE
                  </Badge>
                )}
                {hasResult && (
                  <Badge variant="secondary" className="text-xs">
                    FINALIZADO
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {bout.weight_class}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isLocked ? "destructive" : "secondary"} className="text-xs">
                {isLocked ? "LOCK" : "OPEN"}
              </Badge>
              <Button
                size="sm"
                variant={isLocked ? "outline" : "destructive"}
                onClick={() => handleLockBout(bout.id, !isLocked)}
                disabled={lockingBout === bout.id || hasResult}
                className="h-8"
              >
                {lockingBout === bout.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isLocked ? (
                  <Unlock className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
