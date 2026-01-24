import { FlagBadge } from "./FlagBadge"
import { Card } from "./ui/card"

interface FighterCardProps {
  name: string
  imageUrl?: string
  ranking?: string
  country: string
  countryCode: string
  fightingOutOf?: string
  record: {
    wins: number
    losses: number
    draws: number
  }
  age?: number // optional - may not have data
  height?: number // in cm, optional
  reach?: number // in cm, optional
  side: "red" | "blue"
  isSelected?: boolean
  onSelect?: () => void
  disabled?: boolean
}

export function FighterCard({
  name,
  imageUrl,
  ranking,
  country,
  countryCode,
  fightingOutOf,
  record,
  age,
  height,
  reach,
  side,
  isSelected = false,
  onSelect,
  disabled = false
}: FighterCardProps) {
  const cornerClass = side === "red" ? "border-fighter-red" : "border-fighter-blue"
  const selectedClass = isSelected
    ? side === "red"
      ? "ring-2 ring-fighter-red bg-fighter-red/10"
      : "ring-2 ring-fighter-blue bg-fighter-blue/10"
    : ""

  return (
    <Card
      className={`p-6 space-y-4 transition-all ${cornerClass} ${selectedClass} ${
        disabled ? "opacity-50 cursor-not-allowed" : onSelect ? "cursor-pointer hover:shadow-lg" : ""
      }`}
      onClick={!disabled && onSelect ? onSelect : undefined}
    >
      {/* Fighter Image */}
      {imageUrl && (
        <div className="flex justify-center">
          <div
            className="rounded-lg overflow-hidden border-2"
            style={{
              width: '261px',
              height: '261px',
              aspectRatio: '1 / 1',
              borderColor: side === "red" ? "hsl(var(--fighter-red))" : "hsl(var(--fighter-blue))"
            }}
          >
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Fighter Name */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{name}</h2>
        {ranking && (
          <p className="text-sm text-primary font-medium mt-1">{ranking}</p>
        )}
      </div>

      {/* Nationality */}
      {country && country !== "Unknown" && (
        <div className="flex justify-center">
          <FlagBadge country={country} countryCode={countryCode} />
        </div>
      )}

      {/* Fighting Out Of */}
      {fightingOutOf && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Fighting out of</p>
          <p className="text-sm">{fightingOutOf}</p>
        </div>
      )}

      {/* Record */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Record</p>
        <p className="text-xl font-bold">
          {record.wins === 0 && record.losses === 0 && record.draws === 0
            ? "N/A"
            : `${record.wins}–${record.losses}–${record.draws}`}
        </p>
      </div>

      {/* Age */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Age</p>
        <p className="text-lg font-semibold">{age && age > 0 ? age : "N/A"}</p>
      </div>

      {/* Height & Reach */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Height</p>
          <p className="font-medium">{height && height > 0 ? `${height} cm` : "N/A"}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Reach</p>
          <p className="font-medium">{reach && reach > 0 ? `${reach} cm` : "N/A"}</p>
        </div>
      </div>
    </Card>
  )
}
