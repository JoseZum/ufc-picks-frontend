import { cn } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface EventCardProps {
  id: string;
  name: string;
  date: string;
  location: string;
  isUpcoming: boolean;
  status?: "scheduled" | "completed" | "cancelled";
  fightsCount: number;
  posterUrl?: string;
  mainEvent?: {
    fighterRed: string;
    fighterBlue: string;
    winner?: string;
    method?: string;
    round?: number;
  };
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  name,
  date,
  location,
  isUpcoming,
  status,
  fightsCount,
  posterUrl,
  mainEvent,
  onClick,
  className,
}: EventCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "card-gradient border-border/50 overflow-hidden cursor-pointer transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        status === "completed" && "opacity-75 grayscale-[30%]",
        className
      )}
    >
      <div className="flex">
        {/* Event Poster */}
        {posterUrl && !imageError && (
          <div className="w-32 h-full bg-secondary overflow-hidden flex-shrink-0">
            <img
              src={posterUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{name}</h3>
              {mainEvent && (
                <div className="mt-1">
                  <p className="text-sm text-muted-foreground">
                    {mainEvent.fighterRed} vs {mainEvent.fighterBlue}
                  </p>
                  {mainEvent.winner && mainEvent.method && (
                    <p className="text-xs text-primary font-medium mt-1">
                      {mainEvent.winner} wins by {mainEvent.method}
                      {mainEvent.method !== 'DEC' && mainEvent.round && ` (R${mainEvent.round})`}
                    </p>
                  )}
                </div>
              )}
            </div>
            <StatusBadge status={isUpcoming ? "open" : status === "completed" ? "completed" : "locked"} />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{fightsCount} fights</span>
            <span className="text-xs font-medium text-primary">View Card →</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
