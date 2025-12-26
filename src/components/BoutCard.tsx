'use client'

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { PickDetails } from "./PickDetails";
import type { VictoryMethod } from "@/types/picks";

interface BoutCardProps {
  order: number;
  fighterRed: string;
  fighterBlue: string;
  imageUrlRed?: string;
  imageUrlBlue?: string;
  weightClass: string;
  rounds: number;
  isMainEvent?: boolean;
  isCoMain?: boolean;
  cardSection: "main" | "prelims" | "early";
  pickStatus?: "pending" | "correct" | "incorrect";
  selectedFighter?: "red" | "blue";
  selectedMethod?: VictoryMethod;
  selectedRound?: 1 | 2 | 3 | 4 | 5;
  winner?: "red" | "blue";
  actualMethod?: VictoryMethod;
  actualRound?: 1 | 2 | 3 | 4 | 5;
  points?: 0 | 1 | 2 | 3;
  isLocked?: boolean;
  eventId?: string;
  fightId?: string;
  onMakePick?: (fighter: "red" | "blue") => void;
  className?: string;
}

export function BoutCard({
  order,
  fighterRed,
  fighterBlue,
  imageUrlRed,
  imageUrlBlue,
  weightClass,
  rounds,
  isMainEvent,
  isCoMain,
  pickStatus,
  selectedFighter,
  selectedMethod,
  selectedRound,
  winner,
  actualMethod,
  actualRound,
  points,
  isLocked,
  eventId,
  fightId,
  onMakePick,
  className,
}: BoutCardProps) {
  const router = useRouter()
  const showResult = winner !== undefined;

  const handleCardClick = () => {
    if (eventId && fightId) {
      router.push(`/events/${eventId}/fights/${fightId}`)
    }
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "card-gradient border-border/50 p-4 transition-all duration-200",
        isMainEvent && "border-primary/50 ring-1 ring-primary/20",
        eventId && fightId && "cursor-pointer hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{order}</span>
          {isMainEvent && (
            <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
              Main Event
            </Badge>
          )}
          {isCoMain && (
            <Badge variant="secondary" className="text-xs">
              Co-Main
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {weightClass} • {rounds}R
          </span>
          {pickStatus && <StatusBadge status={pickStatus} />}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Red Corner */}
        <div className="flex-1 flex items-center gap-3">
          {imageUrlRed && (
            <div
              className="rounded-lg overflow-hidden border-2 border-fighter-red flex-shrink-0"
              style={{
                width: '80px',
                height: '80px',
                aspectRatio: '1 / 1'
              }}
            >
              <img
                src={imageUrlRed}
                alt={fighterRed}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-fighter-red flex-shrink-0" />
              <span className="text-xs text-muted-foreground uppercase">Red Corner</span>
            </div>
            <p className="font-semibold text-foreground truncate">{fighterRed}</p>
            {selectedFighter === "red" && (
              <span className="text-xs text-primary mt-1 block">Your Pick</span>
            )}
          </div>
        </div>

        <div className="flex items-center px-2">
          <span className="text-muted-foreground font-bold text-sm">VS</span>
        </div>

        {/* Blue Corner */}
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-fighter-blue flex-shrink-0" />
              <span className="text-xs text-muted-foreground uppercase">Blue Corner</span>
            </div>
            <p className="font-semibold text-foreground truncate">{fighterBlue}</p>
            {selectedFighter === "blue" && (
              <span className="text-xs text-primary mt-1 block">Your Pick</span>
            )}
          </div>
          {imageUrlBlue && (
            <div
              className="rounded-lg overflow-hidden border-2 border-fighter-blue flex-shrink-0"
              style={{
                width: '80px',
                height: '80px',
                aspectRatio: '1 / 1'
              }}
            >
              <img
                src={imageUrlBlue}
                alt={fighterBlue}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Pick Details */}
      {selectedMethod && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <PickDetails
            method={selectedMethod}
            round={selectedRound}
            points={points}
            actualMethod={actualMethod}
            actualRound={actualRound}
            status={pickStatus}
            showActual={!!actualMethod}
          />
        </div>
      )}

      {eventId && fightId && !selectedFighter && (
        <div className="mt-3 text-center">
          <span className="text-xs text-muted-foreground">
            {isLocked ? "Picks locked - Click to view details" : "Click to view details and make your pick"}
          </span>
        </div>
      )}
    </Card>
  );
}
