'use client'

import { useState } from "react";
import { useRouter } from 'next/navigation'
import { EventCard } from "@/components/EventCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Filter, AlertCircle } from "lucide-react";
import { useEvents } from "@/lib/hooks";
import { getEventPosterUrl } from "@/lib/api";
import type { Event } from "@/lib/api";

// Helper to format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper to format location
function formatLocation(location?: { venue?: string; city?: string; country?: string }): string {
  if (!location) return 'TBD';
  const parts = [location.city, location.country].filter(Boolean);
  return parts.join(', ') || 'TBD';
}

// Helper to check if event is upcoming
function isEventUpcoming(event: Event): boolean {
  return event.status === 'scheduled';
}

export function EventsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("2026");

  // Fetch events from API
  const { data, isLoading, error } = useEvents({ limit: 50 });
  const events = data?.events || [];

  // Filter events based on status
  const filteredEvents = events.filter((event) => {
    if (statusFilter === "upcoming" && !isEventUpcoming(event)) return false;
    if (statusFilter === "completed" && isEventUpcoming(event)) return false;
    return true;
  });

  const upcomingEvents = filteredEvents.filter((e) => isEventUpcoming(e));
  const completedEvents = filteredEvents.filter((e) => !isEventUpcoming(e));

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-4xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load events. Please try again later.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[100px] bg-secondary border-border">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Upcoming Events
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                id={String(event.id)}
                name={event.name}
                date={formatDate(event.date)}
                location={formatLocation(event.location)}
                isUpcoming={true}
                fightsCount={event.total_bouts}
                posterUrl={getEventPosterUrl(event)}
                onClick={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Events */}
      {completedEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Completed Events
          </h2>
          <div className="space-y-3">
            {completedEvents.map((event) => (
              <EventCard
                key={event.id}
                id={String(event.id)}
                name={event.name}
                date={formatDate(event.date)}
                location={formatLocation(event.location)}
                isUpcoming={false}
                fightsCount={event.total_bouts}
                posterUrl={getEventPosterUrl(event)}
                onClick={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No events found</p>
        </div>
      )}
    </div>
  );
}
