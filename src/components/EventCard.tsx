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
  fightsCount: number;
  posterUrl?: string;
  mainEvent?: {
    fighterRed: string;
    fighterBlue: string;
  };
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  name,
  date,
  location,
  isUpcoming,
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
        className
      )}
    >
      {/* Event Poster */}
      {posterUrl && !imageError && (
        <div className="w-full h-32 bg-secondary overflow-hidden">
          <img
            src={posterUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            {mainEvent && (
              <p className="text-sm text-muted-foreground mt-1">
                {mainEvent.fighterRed} vs {mainEvent.fighterBlue}
              </p>
            )}
          </div>
          <StatusBadge status={isUpcoming ? "open" : "locked"} />
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
    </Card>
  );
}
