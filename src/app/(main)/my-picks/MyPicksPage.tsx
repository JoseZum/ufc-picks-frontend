'use client'

import { useState } from "react";
import { BoutCard } from "@/components/BoutCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Calendar, CheckCircle, XCircle, Clock, Trophy } from "lucide-react";
import type { VictoryMethod } from "@/types/picks";

// Mock data
const myPicksData = {
  "ufc-310": {
    eventName: "UFC 310",
    eventDate: "Dec 7, 2024",
    status: "pending" as const,
    picks: [
      {
        order: 1,
        fighterRed: "Alexandre Pantoja",
        fighterBlue: "Kai Asakura",
        weightClass: "Flyweight",
        rounds: 5,
        isMainEvent: true,
        selectedFighter: "red" as const,
        selectedMethod: "SUB" as VictoryMethod,
        selectedRound: 3 as const,
        cardSection: "main" as const,
      },
      {
        order: 2,
        fighterRed: "Shavkat Rakhmonov",
        fighterBlue: "Ian Machado Garry",
        weightClass: "Welterweight",
        rounds: 5,
        isCoMain: true,
        selectedFighter: "blue" as const,
        selectedMethod: "DEC" as VictoryMethod,
        cardSection: "main" as const,
      },
    ],
  },
  "ufc-309": {
    eventName: "UFC 309",
    eventDate: "Nov 16, 2024",
    status: "completed" as const,
    picks: [
      {
        order: 1,
        fighterRed: "Jon Jones",
        fighterBlue: "Stipe Miocic",
        weightClass: "Heavyweight",
        rounds: 5,
        isMainEvent: true,
        selectedFighter: "red" as const,
        selectedMethod: "KO/TKO" as VictoryMethod,
        selectedRound: 3 as const,
        winner: "red" as const,
        actualMethod: "KO/TKO" as VictoryMethod,
        actualRound: 3 as const,
        points: 3 as const, // PERFECT PICK!
        cardSection: "main" as const,
      },
      {
        order: 2,
        fighterRed: "Charles Oliveira",
        fighterBlue: "Michael Chandler",
        weightClass: "Lightweight",
        rounds: 5,
        isCoMain: true,
        selectedFighter: "red" as const,
        selectedMethod: "DEC" as VictoryMethod,
        winner: "red" as const,
        actualMethod: "DEC" as VictoryMethod,
        points: 2 as const, // Ganador + método
        cardSection: "main" as const,
      },
      {
        order: 3,
        fighterRed: "Bo Nickal",
        fighterBlue: "Paul Craig",
        weightClass: "Middleweight",
        rounds: 3,
        selectedFighter: "red" as const,
        selectedMethod: "SUB" as VictoryMethod,
        selectedRound: 2 as const,
        winner: "red" as const,
        actualMethod: "SUB" as VictoryMethod,
        actualRound: 1 as const,
        points: 2 as const, // Ganador + método (round incorrecto)
        cardSection: "main" as const,
      },
      {
        order: 4,
        fighterRed: "Mauricio Ruffy",
        fighterBlue: "James Llontop",
        weightClass: "Lightweight",
        rounds: 3,
        selectedFighter: "blue" as const,
        selectedMethod: "KO/TKO" as VictoryMethod,
        selectedRound: 1 as const,
        winner: "red" as const,
        actualMethod: "KO/TKO" as VictoryMethod,
        actualRound: 1 as const,
        points: 0 as const, // Ganador incorrecto = 0 puntos
        cardSection: "prelims" as const,
      },
    ],
  },
};

export function MyPicksPage() {
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [cardSection, setCardSection] = useState<string>("all");

  const events = Object.entries(myPicksData);
  const pendingEvents = events.filter(([_, e]) => e.status === "pending");
  const completedEvents = events.filter(([_, e]) => e.status === "completed");

  const calculateStats = () => {
    let correct = 0;
    let incorrect = 0;
    let pending = 0;
    let totalPoints = 0;
    let perfect3Pointers = 0;

    events.forEach(([_, event]) => {
      event.picks.forEach((pick) => {
        if (pick.winner === undefined) {
          pending++;
        } else {
          const points = pick.points || 0;
          totalPoints += points;

          if (points > 0) {
            correct++;
          } else {
            incorrect++;
          }

          if (points === 3) {
            perfect3Pointers++;
          }
        }
      });
    });

    return {
      correct,
      incorrect,
      pending,
      total: correct + incorrect + pending,
      totalPoints,
      perfect3Pointers,
    };
  };

  const stats = calculateStats();

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">My Picks</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="card-gradient p-3 text-center">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Picks</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalPoints}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-xl font-bold text-success">{stats.correct}</p>
          </div>
          <p className="text-xs text-muted-foreground">Correct</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <XCircle className="h-4 w-4 text-destructive" />
            <p className="text-xl font-bold text-destructive">{stats.incorrect}</p>
          </div>
          <p className="text-xs text-muted-foreground">Incorrect</p>
        </Card>
        <Card className="card-gradient p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="h-4 w-4 text-ufc-gold" />
            <p className="text-xl font-bold text-ufc-gold">{stats.perfect3Pointers}</p>
          </div>
          <p className="text-xs text-muted-foreground">Perfect (3pts)</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={cardSection} onValueChange={setCardSection}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Card Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            <SelectItem value="main">Main Card</SelectItem>
            <SelectItem value="prelims">Prelims</SelectItem>
            <SelectItem value="early">Early Prelims</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Picks */}
      {pendingEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Results
          </h2>
          {pendingEvents.map(([eventId, event]) => (
            <div key={eventId} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{event.eventName}</span>
                <span className="text-sm text-muted-foreground">• {event.eventDate}</span>
              </div>
              <div className="space-y-3">
                {event.picks.map((pick) => (
                  <BoutCard
                    key={pick.order}
                    {...pick}
                    pickStatus="pending"
                    isLocked
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Completed Picks */}
      {completedEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Completed
          </h2>
          {completedEvents.map(([eventId, event]) => (
            <div key={eventId} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{event.eventName}</span>
                <span className="text-sm text-muted-foreground">• {event.eventDate}</span>
              </div>
              <div className="space-y-3">
                {event.picks.map((pick) => (
                  <BoutCard
                    key={pick.order}
                    {...pick}
                    pickStatus={pick.selectedFighter === pick.winner ? "correct" : "incorrect"}
                    isLocked
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
