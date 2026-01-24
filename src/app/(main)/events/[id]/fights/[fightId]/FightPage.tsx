'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FighterCard } from "@/components/FighterCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ArrowLeft, Flame, Lock, CheckCircle, Loader2 } from "lucide-react"
import type { VictoryMethod, Pick } from "@/types/picks"
import { useEvent, useEventBouts, useMyPicks, useCreatePick } from "@/lib/hooks"
import { getFighterImageUrl } from "@/lib/api"

export function FightPage({ eventId, fightId }: { eventId: string; fightId: string }) {
  const router = useRouter()
  
  // Convertir IDs a números
  const eventIdNum = parseInt(eventId, 10);
  const fightIdNum = parseInt(fightId, 10);
  
  // Obtener datos del API
  const { data: event, isLoading: eventLoading } = useEvent(eventIdNum);
  const { data: bouts, isLoading: boutsLoading } = useEventBouts(eventIdNum);
  const { data: existingPicks } = useMyPicks(eventIdNum);
  const createPickMutation = useCreatePick();
  
  // Encontrar la pelea específica
  const bout = bouts?.find(b => b.id === fightIdNum);
  
  // Encontrar el índice para determinar si es main/co-main
  const boutIndex = bouts?.findIndex(b => b.id === fightIdNum) ?? -1;

  const [selectedFighter, setSelectedFighter] = useState<"red" | "blue" | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<VictoryMethod | null>(null)
  const [selectedRound, setSelectedRound] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [pickConfirmed, setPickConfirmed] = useState(false)

  // Find existing pick for this bout and pre-populate form
  const existingPick = existingPicks?.find(p => p.bout_id === fightIdNum);

  useEffect(() => {
    if (existingPick) {
      setSelectedFighter(existingPick.picked_corner);
      setSelectedMethod(existingPick.picked_method);
      if (existingPick.picked_round) {
        setSelectedRound(existingPick.picked_round as 1 | 2 | 3 | 4 | 5);
      }
      setPickConfirmed(true);
    }
  }, [existingPick]);

  // Loading state
  if (eventLoading || boutsLoading) {
    return (
      <div className="container max-w-6xl py-6 px-4 space-y-6">
        <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state - bout not found
  if (!bout || !event) {
    return (
      <div className="container max-w-6xl py-6 px-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/events/${eventId}`)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
        <Card className="card-gradient p-8 text-center">
          <p className="text-muted-foreground">Fight not found</p>
        </Card>
      </div>
    );
  }

  // Datos de la pelea
  const picksOpen = event.status === 'scheduled';
  const isMainEvent = boutIndex === 0;
  const isCoMain = boutIndex === 1;
  const cardSection = boutIndex < 5 ? "Main Card" : "Prelims";
  
  // Datos de los peleadores
  const fighterRed = bout.fighters.red;
  const fighterBlue = bout.fighters.blue;

  const handleSelectFighter = (fighter: "red" | "blue") => {
    if (!pickConfirmed && picksOpen) {
      setSelectedFighter(fighter)
    }
  }

  const handleConfirmPick = async () => {
    if (selectedFighter && selectedMethod) {
      const pickData = {
        event_id: eventIdNum,
        bout_id: fightIdNum,
        picked_corner: selectedFighter,
        picked_method: selectedMethod,
        ...(selectedMethod !== "DEC" && selectedRound ? { picked_round: selectedRound } : {})
      };

      try {
        await createPickMutation.mutateAsync(pickData);
        setPickConfirmed(true);
      } catch (error) {
        console.error("Error saving pick:", error);
      }
    }
  }

  const handleReset = () => {
    setSelectedFighter(null)
    setSelectedMethod(null)
    setSelectedRound(null)
  }

  const selectedFighterName = selectedFighter === "red"
    ? fighterRed?.fighter_name
    : selectedFighter === "blue"
    ? fighterBlue?.fighter_name
    : null

  // Formatear fecha del evento
  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/events/${eventId}`)}
        className="text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Event
      </Button>

      {/* Header - Event Info */}
      <Card className="card-gradient p-6 border-primary/30">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">
            {eventDate} · {cardSection}
          </p>
          {isMainEvent && (
            <Badge className="gap-1 bg-primary/20 text-primary border-primary/50">
              <Flame className="h-3 w-3" />
              Main Event
            </Badge>
          )}
          {isCoMain && (
            <Badge className="gap-1 bg-secondary text-secondary-foreground">
              Co-Main Event
            </Badge>
          )}
        </div>
      </Card>

      {/* Fight Meta */}
      <div className="text-center">
        <p className="text-muted-foreground">
          {bout.weight_class} · {bout.rounds_scheduled} Rounds · {bout.is_title_fight ? "Title Fight" : "Non-Title Bout"}
        </p>
      </div>

      {/* Fighter Comparison */}
      <div className="relative grid md:grid-cols-2 gap-6">
        {fighterRed && (
          <FighterCard
            name={fighterRed.fighter_name}
            imageUrl={getFighterImageUrl(fighterRed)}
            ranking={fighterRed.ranking ? `#${fighterRed.ranking.position} ${fighterRed.ranking.division}` : undefined}
            country={fighterRed.nationality || "Unknown"}
            countryCode={fighterRed.nationality?.substring(0, 2).toUpperCase() || "XX"}
            fightingOutOf={fighterRed.fighting_out_of}
            record={{
              wins: fighterRed.record_at_fight?.wins || 0,
              losses: fighterRed.record_at_fight?.losses || 0,
              draws: fighterRed.record_at_fight?.draws || 0
            }}
            age={fighterRed.age_at_fight_years}
            height={fighterRed.height_cm}
            reach={fighterRed.reach_cm}
            side="red"
            isSelected={selectedFighter === "red"}
            onSelect={() => handleSelectFighter("red")}
            disabled={pickConfirmed || !picksOpen}
          />
        )}

        {/* VS Divider - Hidden on mobile, shown on desktop */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-16 h-16 rounded-full bg-background border-4 border-border flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
          </div>
        </div>

        {fighterBlue && (
          <FighterCard
            name={fighterBlue.fighter_name}
            imageUrl={getFighterImageUrl(fighterBlue)}
            ranking={fighterBlue.ranking ? `#${fighterBlue.ranking.position} ${fighterBlue.ranking.division}` : undefined}
            country={fighterBlue.nationality || "Unknown"}
            countryCode={fighterBlue.nationality?.substring(0, 2).toUpperCase() || "XX"}
            fightingOutOf={fighterBlue.fighting_out_of}
            record={{
              wins: fighterBlue.record_at_fight?.wins || 0,
              losses: fighterBlue.record_at_fight?.losses || 0,
              draws: fighterBlue.record_at_fight?.draws || 0
            }}
            age={fighterBlue.age_at_fight_years}
            height={fighterBlue.height_cm}
            reach={fighterBlue.reach_cm}
            side="blue"
            isSelected={selectedFighter === "blue"}
            onSelect={() => handleSelectFighter("blue")}
            disabled={pickConfirmed || !picksOpen}
          />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/50 my-8" />

      {/* Pick Action */}
      <Card className="card-gradient p-6">
        {!picksOpen ? (
          // Estado 3: Picks cerrados
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-semibold">Picks are locked</p>
            <p className="text-sm text-muted-foreground">Event has started</p>
          </div>
        ) : pickConfirmed ? (
          // Estado 2: Pick confirmado
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Pick</p>
              <p className="text-xl font-bold">{selectedFighterName}</p>
              <div className="flex items-center justify-center gap-2 text-sm mt-2">
                <Badge variant="secondary">{selectedMethod}</Badge>
                {selectedRound && (
                  <Badge variant="secondary">Round {selectedRound}</Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Pick confirmed! Good luck!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickConfirmed(false)}
            >
              Edit Pick
            </Button>
          </div>
        ) : !selectedFighter ? (
          // Paso 1: Seleccionar ganador
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Step 1: Choose your fighter
            </p>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-fighter-red hover:bg-fighter-red/10 hover:border-fighter-red"
              onClick={() => handleSelectFighter("red")}
            >
              PICK {fighterRed?.fighter_name.toUpperCase() || 'RED CORNER'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-fighter-blue hover:bg-fighter-blue/10 hover:border-fighter-blue"
              onClick={() => handleSelectFighter("blue")}
            >
              PICK {fighterBlue?.fighter_name.toUpperCase() || 'BLUE CORNER'}
            </Button>
          </div>
        ) : !selectedMethod ? (
          // Paso 2: Seleccionar método
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Your pick:</p>
              <p className="text-lg font-semibold">{selectedFighterName}</p>
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Step 2: How will they win?
              </p>
              <ToggleGroup
                type="single"
                value={selectedMethod || undefined}
                onValueChange={(value) => {
                  if (value) setSelectedMethod(value as VictoryMethod)
                }}
                className="grid grid-cols-3 gap-2"
              >
                <ToggleGroupItem
                  value="DEC"
                  className="flex-1 border-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <div className="text-center">
                    <p className="font-bold">DEC</p>
                    <p className="text-xs text-muted-foreground">Decision</p>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="KO/TKO"
                  className="flex-1 border-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <div className="text-center">
                    <p className="font-bold">KO/TKO</p>
                    <p className="text-xs text-muted-foreground">Knockout</p>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="SUB"
                  className="flex-1 border-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <div className="text-center">
                    <p className="font-bold">SUB</p>
                    <p className="text-xs text-muted-foreground">Submission</p>
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFighter(null)}
                className="w-full"
              >
                Change Fighter
              </Button>
            </div>
          </div>
        ) : selectedMethod !== "DEC" && !selectedRound ? (
          // Paso 3: Seleccionar round (solo si no es DEC)
          (() => {
            // Main events and title fights are always 5 rounds
            const totalRounds = (isMainEvent || bout.is_title_fight) ? 5 : bout.rounds_scheduled;
            return (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Your pick:</p>
                  <p className="text-lg font-semibold">
                    {selectedFighterName} by {selectedMethod}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Step 3: Which round?
                  </p>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
                      <button
                        key={round}
                        onClick={() => setSelectedRound(round as 1 | 2 | 3 | 4 | 5)}
                        className={`
                          w-12 h-12 rounded-full font-bold text-sm transition-all
                          ${selectedRound === round
                            ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                            : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border hover:border-primary/50'
                          }
                        `}
                      >
                        R{round}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMethod(null)}
                    className="w-full"
                  >
                    Change Method
                  </Button>
                </div>
              </div>
            );
          })()
        ) : (
          // Paso 4: Confirmar pick completo
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Your prediction:</p>
              <p className="text-xl font-bold">{selectedFighterName}</p>
              <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                <Badge variant="secondary">{selectedMethod}</Badge>
                {selectedRound && (
                  <Badge variant="secondary">Round {selectedRound}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Potential points: {selectedMethod === "DEC" ? "2" : selectedRound ? "3" : "2"}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleConfirmPick}
              >
                Confirm Pick
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
