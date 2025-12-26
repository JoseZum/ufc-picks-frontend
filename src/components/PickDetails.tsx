'use client'

import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VictoryMethod } from "@/types/picks"

interface PickDetailsProps {
  method: VictoryMethod
  round?: 1 | 2 | 3 | 4 | 5
  points?: 0 | 1 | 2 | 3
  actualMethod?: VictoryMethod
  actualRound?: 1 | 2 | 3 | 4 | 5
  status?: "pending" | "correct" | "incorrect"
  size?: "sm" | "md" | "lg"
  showActual?: boolean
}

export function PickDetails({
  method,
  round,
  points,
  actualMethod,
  actualRound,
  status = "pending",
  size = "md",
  showActual = false,
}: PickDetailsProps) {
  const badgeClass = cn(
    size === "sm" && "text-xs px-2 py-0.5",
    size === "md" && "text-sm px-2.5 py-1",
    size === "lg" && "text-base px-3 py-1.5",
    status === "correct" && "bg-success/20 text-success border-success/30",
    status === "incorrect" && "bg-destructive/20 text-destructive border-destructive/30",
    status === "pending" && "bg-secondary text-secondary-foreground"
  )

  const getMethodLabel = (m: VictoryMethod) => {
    switch (m) {
      case "DEC":
        return "Decision"
      case "KO/TKO":
        return "KO/TKO"
      case "SUB":
        return "Submission"
    }
  }

  return (
    <div className="space-y-2">
      {/* Prediction */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Prediction:</span>
        <Badge variant="secondary" className={badgeClass}>
          {method}
        </Badge>
        {round && (
          <Badge variant="secondary" className={badgeClass}>
            R{round}
          </Badge>
        )}
        {points !== undefined && (
          <div className="flex items-center gap-1 ml-auto">
            <Trophy
              className={cn(
                "h-3.5 w-3.5",
                points === 3 && "text-ufc-gold",
                points === 2 && "text-primary",
                points === 1 && "text-muted-foreground",
                points === 0 && "text-destructive"
              )}
            />
            <span
              className={cn(
                "text-sm font-bold",
                points === 3 && "text-ufc-gold",
                points === 2 && "text-primary",
                points === 1 && "text-muted-foreground",
                points === 0 && "text-destructive"
              )}
            >
              {points}pt{points !== 1 && "s"}
            </span>
          </div>
        )}
      </div>

      {/* Actual Result */}
      {showActual && actualMethod && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Actual:</span>
          <Badge variant="outline" className="text-xs">
            {actualMethod}
          </Badge>
          {actualRound && (
            <Badge variant="outline" className="text-xs">
              R{actualRound}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
