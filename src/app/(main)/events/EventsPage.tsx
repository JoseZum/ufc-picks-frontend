'use client'

import { useState } from "react";
import { useRouter } from 'next/navigation'
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter } from "lucide-react";

// Mock data
const eventsData = [
  {
    id: "ufc-310",
    name: "UFC 310",
    date: "Dec 7, 2024",
    location: "Las Vegas, NV",
    isUpcoming: true,
    fightsCount: 13,
    mainEvent: { fighterRed: "Alexandre Pantoja", fighterBlue: "Kai Asakura" },
  },
  {
    id: "ufc-fight-night-248",
    name: "UFC Fight Night 248",
    date: "Dec 14, 2024",
    location: "Tampa, FL",
    isUpcoming: true,
    fightsCount: 12,
    mainEvent: { fighterRed: "Covington", fighterBlue: "Buckley" },
  },
  {
    id: "ufc-309",
    name: "UFC 309",
    date: "Nov 16, 2024",
    location: "New York, NY",
    isUpcoming: false,
    fightsCount: 14,
    mainEvent: { fighterRed: "Jon Jones", fighterBlue: "Stipe Miocic" },
  },
  {
    id: "ufc-fight-night-247",
    name: "UFC Fight Night 247",
    date: "Nov 9, 2024",
    location: "Macau, China",
    isUpcoming: false,
    fightsCount: 11,
    mainEvent: { fighterRed: "Yan Xiaonan", fighterBlue: "Tabatha Ricci" },
  },
  {
    id: "ufc-308",
    name: "UFC 308",
    date: "Oct 26, 2024",
    location: "Abu Dhabi, UAE",
    isUpcoming: false,
    fightsCount: 13,
    mainEvent: { fighterRed: "Ilia Topuria", fighterBlue: "Max Holloway" },
  },
];

export function EventsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("2024");

  const filteredEvents = eventsData.filter((event) => {
    if (statusFilter === "upcoming" && !event.isUpcoming) return false;
    if (statusFilter === "completed" && event.isUpcoming) return false;
    return true;
  });

  const upcomingEvents = filteredEvents.filter((e) => e.isUpcoming);
  const completedEvents = filteredEvents.filter((e) => !e.isUpcoming);

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
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
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
                {...event}
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
                {...event}
                onClick={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
