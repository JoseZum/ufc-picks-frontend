'use client'

import { useState } from "react"
import { Calendar, Clock, Lock, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useEvents } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/api"

export function EventTimingManager() {
  const { data: eventsData, isLoading, refetch } = useEvents({ limit: 20 })
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  const handleSaveEventTiming = async (
    eventId: number,
    eventDate: string,
    picksLockDate: string
  ) => {
    if (!eventDate && !picksLockDate) {
      toast.error("Debes proporcionar al menos una fecha")
      return
    }

    setSaving(eventId)

    try {
      const token = getAuthToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/timing`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            event_date: eventDate || undefined,
            picks_lock_date: picksLockDate || undefined,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al actualizar evento")
      }

      toast.success("Evento actualizado correctamente")
      refetch()
    } catch (error: any) {
      console.error("Error updating event:", error)
      toast.error(error.message || "Error al actualizar evento")
    } finally {
      setSaving(null)
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
        Configura las fechas y horarios de los eventos y cuándo se cierran las picks.
      </p>

      {events.map((event) => (
        <EventTimingCard
          key={event.id}
          event={event}
          expanded={expandedEvent === event.id}
          onToggle={() =>
            setExpandedEvent(expandedEvent === event.id ? null : event.id)
          }
          onSave={handleSaveEventTiming}
          saving={saving === event.id}
        />
      ))}
    </div>
  )
}

function EventTimingCard({
  event,
  expanded,
  onToggle,
  onSave,
  saving,
}: {
  event: any
  expanded: boolean
  onToggle: () => void
  onSave: (eventId: number, eventDate: string, picksLockDate: string) => void
  saving: boolean
}) {
  const [eventDate, setEventDate] = useState("")
  const [picksLockDate, setPicksLockDate] = useState("")

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "No configurado"
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
          <h3 className="font-semibold">{event.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.date)}
            </span>
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
          <div className="space-y-2">
            <Label htmlFor={`event-date-${event.id}`}>
              Fecha y Hora del Evento
            </Label>
            <div className="flex gap-2">
              <Input
                id={`event-date-${event.id}`}
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-secondary"
              />
              <Clock className="h-5 w-5 text-muted-foreground self-center" />
            </div>
            <p className="text-xs text-muted-foreground">
              Hora en que comienza el evento
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`picks-lock-${event.id}`}>
              Fecha de Cierre de Picks
            </Label>
            <div className="flex gap-2">
              <Input
                id={`picks-lock-${event.id}`}
                type="datetime-local"
                value={picksLockDate}
                onChange={(e) => setPicksLockDate(e.target.value)}
                className="bg-secondary"
              />
              <Lock className="h-5 w-5 text-muted-foreground self-center" />
            </div>
            <p className="text-xs text-muted-foreground">
              Momento en que se cierran las picks para este evento
            </p>
          </div>

          <Button
            onClick={() => onSave(event.id, eventDate, picksLockDate)}
            disabled={saving || (!eventDate && !picksLockDate)}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}
