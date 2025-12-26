'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from "@/components/AppLayout"
import { CountdownTimer } from "@/components/CountdownTimer"
import { LeaderboardRow } from "@/components/LeaderboardRow"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Calendar, Flame, Target, Trophy } from "lucide-react"

// Mock data
const nextEvent = {
  id: "ufc-310",
  name: "UFC 310",
  subtitle: "Pantoja vs Asakura",
  date: new Date("2024-12-07T23:00:00"),
  location: "T-Mobile Arena, Las Vegas",
  fightsCount: 13,
  picksOpen: true,
  mainEvent: {
    fighterRed: "Alexandre Pantoja",
    fighterBlue: "Kai Asakura",
    weightClass: "Flyweight Title",
  },
}

const topUsers = [
  { rank: 1, username: "PredictorKing", points: 2450, accuracy: 78 },
  { rank: 2, username: "UFCAnalyst", points: 2380, accuracy: 75 },
  { rank: 3, username: "FightPicksPro", points: 2290, accuracy: 73 },
  { rank: 4, username: "OctagonOracle", points: 2180, accuracy: 71 },
  { rank: 5, username: "MMAProphet", points: 2050, accuracy: 68 },
]

export function HomePage() {
  const router = useRouter()

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl">UFC Picks</h1>
            <p className="text-xs text-muted-foreground">Compete. Predict. Win.</p>
          </div>
        </div>

        {/* Next Event Hero */}
        <Card className="card-gradient border-primary/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Next Event</span>
              </div>
              <StatusBadge status={nextEvent.picksOpen ? "open" : "locked"} />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">{nextEvent.name}</h2>
            <p className="text-primary font-semibold mb-4">{nextEvent.subtitle}</p>

            <div className="bg-secondary/50 rounded-lg p-4 mb-4">
              <p className="text-xs text-muted-foreground text-center mb-3">Main Event</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-right">
                  <div className="w-2 h-2 rounded-full bg-fighter-red inline-block mr-2" />
                  <span className="font-semibold">{nextEvent.mainEvent.fighterRed}</span>
                </div>
                <span className="text-muted-foreground font-bold">VS</span>
                <div className="text-left">
                  <span className="font-semibold">{nextEvent.mainEvent.fighterBlue}</span>
                  <div className="w-2 h-2 rounded-full bg-fighter-blue inline-block ml-2" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {nextEvent.mainEvent.weightClass}
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center mb-4">
              Countdown to Event Start
            </p>
            <CountdownTimer targetDate={nextEvent.date} />

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/events/${nextEvent.id}`)}
                className="flex-1 gap-2"
                size="lg"
              >
                <Target className="h-4 w-4" />
                Make Picks
              </Button>
              <Button
                onClick={() => router.push("/leaderboards")}
                variant="secondary"
                className="flex-1 gap-2"
                size="lg"
              >
                <Trophy className="h-4 w-4" />
                View Leaderboard
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-foreground">42</p>
            <p className="text-xs text-muted-foreground">Your Picks</p>
          </Card>
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-success">68%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </Card>
          <Card className="card-gradient p-4 text-center">
            <p className="text-2xl font-bold text-primary">#24</p>
            <p className="text-xs text-muted-foreground">Your Rank</p>
          </Card>
        </div>

        {/* Mini Leaderboard */}
        <Card className="card-gradient p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Top Predictors</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/leaderboards")}
              className="text-primary"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-1">
            {topUsers.map((user) => (
              <LeaderboardRow
                key={user.rank}
                rank={user.rank}
                username={user.username}
                points={user.points}
                accuracy={user.accuracy}
              />
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
