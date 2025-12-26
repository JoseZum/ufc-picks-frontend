'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BoutCard } from "@/components/BoutCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import type { Pick } from "@/types/picks";

// Mock data
const eventDetails = {
  id: "ufc-310",
  name: "UFC 310",
  subtitle: "Pantoja vs Asakura",
  posterUrl: "/api/placeholder/338/488",
  date: new Date("2024-12-07T23:00:00"),
  displayDate: "Dec 7, 2024 • 10:00 PM ET",
  location: "T-Mobile Arena, Las Vegas, NV",
  picksOpen: true,
  mainCard: [
    {
      order: 1,
      fightId: "pantoja-asakura",
      fighterRed: "Alexandre Pantoja",
      fighterBlue: "Kai Asakura",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Flyweight",
      rounds: 5,
      isMainEvent: true,
    },
    {
      order: 2,
      fightId: "rakhmonov-garry",
      fighterRed: "Shavkat Rakhmonov",
      fighterBlue: "Ian Machado Garry",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Welterweight",
      rounds: 5,
      isCoMain: true,
    },
    {
      order: 3,
      fightId: "gane-volkov",
      fighterRed: "Ciryl Gane",
      fighterBlue: "Alexander Volkov",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Heavyweight",
      rounds: 3,
    },
    {
      order: 4,
      fightId: "mitchell-gracie",
      fighterRed: "Bryce Mitchell",
      fighterBlue: "Kron Gracie",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Featherweight",
      rounds: 3,
    },
    {
      order: 5,
      fightId: "landwehr-choi",
      fighterRed: "Nate Landwehr",
      fighterBlue: "Dooho Choi",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Featherweight",
      rounds: 3,
    },
  ],
  prelims: [
    {
      order: 6,
      fightId: "brown-battle",
      fighterRed: "Randy Brown",
      fighterBlue: "Bryan Battle",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Welterweight",
      rounds: 3,
    },
    {
      order: 7,
      fightId: "reyes-smith",
      fighterRed: "Dominick Reyes",
      fighterBlue: "Anthony Smith",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Light Heavyweight",
      rounds: 3,
    },
    {
      order: 8,
      fightId: "weidman-anders",
      fighterRed: "Chris Weidman",
      fighterBlue: "Eryk Anders",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Middleweight",
      rounds: 3,
    },
    {
      order: 9,
      fightId: "luque-gorimbo",
      fighterRed: "Vicente Luque",
      fighterBlue: "Themba Gorimbo",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Welterweight",
      rounds: 3,
    },
  ],
  earlyPrelims: [
    {
      order: 10,
      fightId: "evloev-sterling",
      fighterRed: "Movsar Evloev",
      fighterBlue: "Aljamain Sterling",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Featherweight",
      rounds: 3,
    },
    {
      order: 11,
      fightId: "nzechukwu-brzeski",
      fighterRed: "Kennedy Nzechukwu",
      fighterBlue: "Lukasz Brzeski",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Heavyweight",
      rounds: 3,
    },
    {
      order: 12,
      fightId: "durden-van",
      fighterRed: "Cody Durden",
      fighterBlue: "Joshua Van",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Flyweight",
      rounds: 3,
    },
    {
      order: 13,
      fightId: "chiesa-griffin",
      fighterRed: "Michael Chiesa",
      fighterBlue: "Max Griffin",
      imageUrlRed: "/api/placeholder/261/261",
      imageUrlBlue: "/api/placeholder/261/261",
      weightClass: "Welterweight",
      rounds: 3,
    },
  ],
};

export function EventDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<number, Pick>>({});

  const handleMakePick = (order: number, fighter: "red" | "blue") => {
    setPicks((prev) => ({
      ...prev,
      [order]: { fighter },
    }));
  };

  const totalBouts =
    eventDetails.mainCard.length +
    eventDetails.prelims.length +
    eventDetails.earlyPrelims.length;

  const picksCount = Object.keys(picks).length;

  const CardSection = ({
    title,
    emoji,
    bouts,
  }: {
    title: string;
    emoji: string;
    bouts: typeof eventDetails.mainCard;
  }) => (
    <section>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h3>
      <div className="space-y-3">
        {bouts.map((bout) => (
          <BoutCard
            key={bout.order}
            {...bout}
            cardSection="main"
            selectedFighter={picks[bout.order]?.fighter}
            isLocked={!eventDetails.picksOpen}
            eventId={eventDetails.id}
            onMakePick={(fighter) => handleMakePick(bout.order, fighter)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/events")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* Event Header */}
      <Card className="card-gradient p-6 border-primary/30">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Event Poster */}
          <div className="flex-shrink-0">
            <div
              className="rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg"
              style={{
                width: '338px',
                height: '488px'
              }}
            >
              <img
                src={eventDetails.posterUrl}
                alt={`${eventDetails.name} poster`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Event Info */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{eventDetails.name}</h1>
                <p className="text-primary font-semibold">{eventDetails.subtitle}</p>
              </div>
              <StatusBadge status={eventDetails.picksOpen ? "open" : "locked"} />
            </div>

            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{eventDetails.displayDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{eventDetails.location}</span>
              </div>
            </div>

            {eventDetails.picksOpen && (
              <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Picks lock when event starts
                </p>
                <CountdownTimer targetDate={eventDetails.date} />
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {picksCount} of {totalBouts} picks made
              </span>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(picksCount / totalBouts) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fight Cards */}
      <CardSection title="Main Card" emoji="🔥" bouts={eventDetails.mainCard} />
      <CardSection title="Prelims" emoji="🟡" bouts={eventDetails.prelims} />
      <CardSection title="Early Prelims" emoji="⚪" bouts={eventDetails.earlyPrelims} />

      {/* Sticky Save Button */}
      {eventDetails.picksOpen && picksCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4 md:left-64">
          <div className="container max-w-4xl">
            <Button size="lg" className="w-full shadow-lg">
              Save {picksCount} Pick{picksCount > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
