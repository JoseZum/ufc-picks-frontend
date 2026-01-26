'use client'

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Trophy, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react"
import { useEvents, useEventBouts } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/api"

export function BoutResultManager() {
  const queryClient = useQueryClient()
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 20 })
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const { data: bouts, isLoading: boutsLoading, refetch } = useEventBouts(
    selectedEventId || 0
  )
  const [expandedBout, setExpandedBout] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const events = eventsData?.events || []

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registra los resultados de las peleas. Los puntos se calculan y asignan
        automáticamente.
      </p>

      {/* Event Selector */}
      <div className="space-y-2">
        <Label>Selecciona un Evento</Label>
        <Select
          value={selectedEventId?.toString() || ""}
          onValueChange={(value) => setSelectedEventId(parseInt(value))}
        >
          <SelectTrigger className="bg-secondary">
            <SelectValue placeholder="Selecciona un evento..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id.toString()}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bouts List */}
      {selectedEventId && (
        <div className="space-y-3">
          {boutsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bouts && bouts.length > 0 ? (
            bouts.map((bout) => (
              <BoutResultCard
                key={bout.id}
                bout={bout}
                expanded={expandedBout === bout.id}
                onToggle={() =>
                  setExpandedBout(expandedBout === bout.id ? null : bout.id)
                }
                onSave={async (data) => {
                  setSaving(bout.id)
                  try {
                    const token = getAuthToken()
                    const response = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/admin/bouts/${bout.id}/result`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(data),
                      }
                    )

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.detail || "Error al registrar resultado")
                    }

                    const result = await response.json()
                    toast.success(
                      `Resultado registrado. ${result.points_assigned.picks_processed} picks procesados, ${result.points_assigned.points_distributed} puntos asignados.`
                    )
                    
                    // Invalidate all relevant queries to refresh data
                    await Promise.all([
                      refetch(), // Refresh bouts
                      queryClient.invalidateQueries({ queryKey: ['myPicks'] }), // Refresh all picks
                      queryClient.invalidateQueries({ queryKey: ['allMyPicks'] }), // Refresh user's picks
                      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }), // Refresh all leaderboards
                    ])
                  } catch (error: any) {
                    console.error("Error saving result:", error)
                    toast.error(error.message || "Error al registrar resultado")
                  } finally {
                    setSaving(null)
                  }
                }}
                onDelete={async () => {
                  setSaving(bout.id)
                  try {
                    const token = getAuthToken()
                    const response = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/admin/bouts/${bout.id}/result`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    )

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.detail || "Error al eliminar resultado")
                    }

                    toast.success("Resultado eliminado y puntos revertidos")
                    
                    // Invalidate all relevant queries to refresh data
                    await Promise.all([
                      refetch(), // Refresh bouts
                      queryClient.invalidateQueries({ queryKey: ['myPicks'] }), // Refresh all picks
                      queryClient.invalidateQueries({ queryKey: ['allMyPicks'] }), // Refresh user's picks
                      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }), // Refresh all leaderboards
                    ])
                  } catch (error: any) {
                    console.error("Error deleting result:", error)
                    toast.error(error.message || "Error al eliminar resultado")
                  } finally {
                    setSaving(null)
                  }
                }}
                saving={saving === bout.id}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay peleas para este evento
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function BoutResultCard({
  bout,
  expanded,
  onToggle,
  onSave,
  onDelete,
  saving,
}: {
  bout: any
  expanded: boolean
  onToggle: () => void
  onSave: (data: any) => void
  onDelete: () => void
  saving: boolean
}) {
  const [winner, setWinner] = useState("")
  const [method, setMethod] = useState("")
  const [round, setRound] = useState("")
  const [time, setTime] = useState("")

  const hasResult = bout.result && bout.status === "completed"
  const redFighter = bout.fighters.red?.fighter_name || "TBD"
  const blueFighter = bout.fighters.blue?.fighter_name || "TBD"

  const handleSubmit = () => {
    if (!winner || !method) {
      toast.error("Debes seleccionar ganador y método")
      return
    }

    onSave({
      winner,
      method,
      round: round ? parseInt(round) : undefined,
      time: time || undefined,
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
            <span className="font-semibold">{redFighter}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-semibold">{blueFighter}</span>
            {hasResult && (
              <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {bout.weight_class} • {bout.rounds_scheduled}R
            {hasResult && ` • ${bout.result.winner === "red" ? redFighter : blueFighter} por ${bout.result.method}`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t border-border/50 space-y-4">
          {hasResult && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-1">
              <p className="text-sm font-medium text-green-600">Resultado Registrado</p>
              <p className="text-xs text-muted-foreground">
                Ganador: {bout.result.winner === "red" ? redFighter : blueFighter} •
                Método: {bout.result.method}
                {bout.result.round && ` • Round: ${bout.result.round}`}
                {bout.result.time && ` • Tiempo: ${bout.result.time}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={saving}
                className="mt-2 text-red-600 hover:text-red-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-2" />
                    Eliminar Resultado
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ganador</Label>
            <Select value={winner} onValueChange={setWinner}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Selecciona ganador..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="red">{redFighter} (Red)</SelectItem>
                <SelectItem value="blue">{blueFighter} (Blue)</SelectItem>
                <SelectItem value="draw">Empate</SelectItem>
                <SelectItem value="nc">No Contest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Selecciona método..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KO/TKO">KO/TKO</SelectItem>
                <SelectItem value="SUB">Submission</SelectItem>
                <SelectItem value="DEC">Decision</SelectItem>
                <SelectItem value="DQ">Descalificación</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`round-${bout.id}`}>Round (opcional)</Label>
              <Input
                id={`round-${bout.id}`}
                type="number"
                min="1"
                max={bout.rounds_scheduled}
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder="Ej: 3"
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`time-${bout.id}`}>Tiempo (opcional)</Label>
              <Input
                id={`time-${bout.id}`}
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Ej: 4:32"
                className="bg-secondary"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !winner || !method || hasResult}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Registrar Resultado y Calcular Puntos
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}
