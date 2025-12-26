'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FighterCard } from "@/components/FighterCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ArrowLeft, Flame, Lock, CheckCircle } from "lucide-react"
import type { VictoryMethod, Pick } from "@/types/picks"

// Mock data - in real app this would come from API
const getMockFightData = (eventId: string, fightId: string) => {
  return {
    event: {
      name: "UFC 310",
      date: "Dec 7, 2024",
      cardSection: "Main Card",
      isMainEvent: true,
      picksOpen: true,
    },
    fight: {
      weightClass: "Lightweight",
      rounds: 5,
      isTitleFight: false,
      fighterRed: {
        name: "Justin Gaethje",
        imageUrl: "/api/placeholder/261/261",
        ranking: "#6 UFC Lightweight",
        country: "United States",
        countryCode: "US",
        fightingOutOf: "Greeley, Colorado",
        record: { wins: 26, losses: 5, draws: 0 },
        age: 37,
        height: 181,
        reach: 178,
      },
      fighterBlue: {
        name: "Paddy Pimblett",
        imageUrl: "/api/placeholder/261/261",
        ranking: "#15 UFC Lightweight",
        country: "United Kingdom",
        countryCode: "GB",
        fightingOutOf: "Liverpool, England",
        record: { wins: 21, losses: 3, draws: 0 },
        age: 29,
        height: 180,
        reach: 182,
      },
    },
  }
}

export function FightPage({ eventId, fightId }: { eventId: string; fightId: string }) {
  const router = useRouter()
  const data = getMockFightData(eventId, fightId)

  const [selectedFighter, setSelectedFighter] = useState<"red" | "blue" | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<VictoryMethod | null>(null)
  const [selectedRound, setSelectedRound] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [pickConfirmed, setPickConfirmed] = useState(false)

  const handleSelectFighter = (fighter: "red" | "blue") => {
    if (!pickConfirmed && data.event.picksOpen) {
      setSelectedFighter(fighter)
    }
  }

  const handleConfirmPick = () => {
    if (selectedFighter && selectedMethod) {
      const pick: Pick = {
        fighter: selectedFighter,
        method: selectedMethod,
        ...(selectedMethod !== "DEC" && selectedRound ? { round: selectedRound } : {})
      }

      // Here you would save the pick to your backend
      console.log("Pick saved:", pick)
      setPickConfirmed(true)
    }
  }

  const handleReset = () => {
    setSelectedFighter(null)
    setSelectedMethod(null)
    setSelectedRound(null)
  }

  const selectedFighterName = selectedFighter === "red"
    ? data.fight.fighterRed.name
    : selectedFighter === "blue"
    ? data.fight.fighterBlue.name
    : null

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
          <h1 className="text-2xl font-bold">{data.event.name}</h1>
          <p className="text-muted-foreground">
            {data.event.date} · {data.event.cardSection}
          </p>
          {data.event.isMainEvent && (
            <Badge className="gap-1 bg-primary/20 text-primary border-primary/50">
              <Flame className="h-3 w-3" />
              Main Event
            </Badge>
          )}
        </div>
      </Card>

      {/* Fight Meta */}
      <div className="text-center">
        <p className="text-muted-foreground">
          {data.fight.weightClass} · {data.fight.rounds} Rounds · {data.fight.isTitleFight ? "Title Fight" : "Non-Title Bout"}
        </p>
      </div>

      {/* Fighter Comparison */}
      <div className="relative grid md:grid-cols-2 gap-6">
        <FighterCard
          {...data.fight.fighterRed}
          side="red"
          isSelected={selectedFighter === "red"}
          onSelect={() => handleSelectFighter("red")}
          disabled={pickConfirmed || !data.event.picksOpen}
        />

        {/* VS Divider - Hidden on mobile, shown on desktop */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-16 h-16 rounded-full bg-background border-4 border-border flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
          </div>
        </div>

        <FighterCard
          {...data.fight.fighterBlue}
          side="blue"
          isSelected={selectedFighter === "blue"}
          onSelect={() => handleSelectFighter("blue")}
          disabled={pickConfirmed || !data.event.picksOpen}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border/50 my-8" />

      {/* Pick Action */}
      <Card className="card-gradient p-6">
        {!data.event.picksOpen ? (
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
            </div>
            <p className="text-xs text-muted-foreground">
              Pick confirmed! Good luck!
            </p>
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
              PICK {data.fight.fighterRed.name.toUpperCase()}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-fighter-blue hover:bg-fighter-blue/10 hover:border-fighter-blue"
              onClick={() => handleSelectFighter("blue")}
            >
              PICK {data.fight.fighterBlue.name.toUpperCase()}
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
              <div className={`grid gap-2 ${data.fight.rounds === 5 ? 'grid-cols-5' : 'grid-cols-3'}`}>
                {Array.from({ length: data.fight.rounds }, (_, i) => i + 1).map((round) => (
                  <Button
                    key={round}
                    variant={selectedRound === round ? "default" : "outline"}
                    onClick={() => setSelectedRound(round as 1 | 2 | 3 | 4 | 5)}
                    className="aspect-square text-lg font-bold"
                  >
                    R{round}
                  </Button>
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
