'use client'

import { useState } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Crown, Star, Flame, Zap, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
type LeaderboardUser = {
  rank: number;
  username: string;
  points: number;
  accuracy: number;
  avatarUrl: string;
  isCurrentUser?: boolean;
};

const leaderboardData: Record<string, LeaderboardUser[]> = {
  global: [
    { rank: 1, username: "PredictorKing", points: 2450, accuracy: 78, avatarUrl: "" },
    { rank: 2, username: "UFCAnalyst", points: 2380, accuracy: 75, avatarUrl: "" },
    { rank: 3, username: "FightPicksPro", points: 2290, accuracy: 73, avatarUrl: "" },
    { rank: 4, username: "OctagonOracle", points: 2180, accuracy: 71, avatarUrl: "" },
    { rank: 5, username: "MMAProphet", points: 2050, accuracy: 68, avatarUrl: "" },
    { rank: 6, username: "KnockoutKing", points: 1980, accuracy: 67, avatarUrl: "" },
    { rank: 7, username: "SubmissionSage", points: 1920, accuracy: 65, avatarUrl: "" },
    { rank: 8, username: "DecisionMaster", points: 1850, accuracy: 64, avatarUrl: "" },
    { rank: 9, username: "TKOTitan", points: 1780, accuracy: 62, avatarUrl: "" },
    { rank: 10, username: "CageChampion", points: 1720, accuracy: 61, avatarUrl: "" },
    { rank: 24, username: "You", points: 1150, accuracy: 68, avatarUrl: "", isCurrentUser: true },
  ],
  mainEvents: [
    { rank: 1, username: "MainEventMaster", points: 580, accuracy: 85, avatarUrl: "" },
    { rank: 2, username: "HeadlinerHero", points: 540, accuracy: 82, avatarUrl: "" },
    { rank: 3, username: "TitleFightPro", points: 510, accuracy: 79, avatarUrl: "" },
    { rank: 4, username: "ChampionChaser", points: 480, accuracy: 77, avatarUrl: "" },
    { rank: 5, username: "MainCardMaven", points: 450, accuracy: 75, avatarUrl: "" },
  ],
  mainCard: [
    { rank: 1, username: "CardKing", points: 1200, accuracy: 76, avatarUrl: "" },
    { rank: 2, username: "MainCardMaster", points: 1150, accuracy: 74, avatarUrl: "" },
    { rank: 3, username: "FeaturedFighter", points: 1080, accuracy: 72, avatarUrl: "" },
    { rank: 4, username: "PPVPredictor", points: 1020, accuracy: 70, avatarUrl: "" },
    { rank: 5, username: "CardCrusher", points: 980, accuracy: 69, avatarUrl: "" },
  ],
  prelims: [
    { rank: 1, username: "PrelimPro", points: 890, accuracy: 72, avatarUrl: "" },
    { rank: 2, username: "UndercardAce", points: 850, accuracy: 70, avatarUrl: "" },
    { rank: 3, username: "ESPNExpert", points: 810, accuracy: 68, avatarUrl: "" },
    { rank: 4, username: "PrelimPredictor", points: 780, accuracy: 67, avatarUrl: "" },
    { rank: 5, username: "WarmupWizard", points: 750, accuracy: 65, avatarUrl: "" },
  ],
  earlyPrelims: [
    { rank: 1, username: "EarlyBird", points: 420, accuracy: 68, avatarUrl: "" },
    { rank: 2, username: "FirstFightFan", points: 390, accuracy: 65, avatarUrl: "" },
    { rank: 3, username: "OpenerOracle", points: 360, accuracy: 63, avatarUrl: "" },
    { rank: 4, username: "DebutDetective", points: 330, accuracy: 61, avatarUrl: "" },
    { rank: 5, username: "EarlyExpert", points: 310, accuracy: 60, avatarUrl: "" },
  ],
  // Method-based leaderboards
  "method-kotko": [
    { rank: 1, username: "KnockoutKing", points: 680, accuracy: 72, avatarUrl: "" },
    { rank: 2, username: "PowerPuncher", points: 650, accuracy: 70, avatarUrl: "" },
    { rank: 3, username: "FinishFinder", points: 620, accuracy: 68, avatarUrl: "" },
    { rank: 4, username: "HeavyHitter", points: 590, accuracy: 66, avatarUrl: "" },
    { rank: 5, username: "TKOTitan", points: 560, accuracy: 64, avatarUrl: "" },
  ],
  "method-sub": [
    { rank: 1, username: "SubmissionSage", points: 520, accuracy: 68, avatarUrl: "" },
    { rank: 2, username: "GrapplingGuru", points: 490, accuracy: 66, avatarUrl: "" },
    { rank: 3, username: "ChokeChampion", points: 460, accuracy: 64, avatarUrl: "" },
    { rank: 4, username: "JiuJitsuJedi", points: 430, accuracy: 62, avatarUrl: "" },
    { rank: 5, username: "TapOutTactician", points: 410, accuracy: 60, avatarUrl: "" },
  ],
  "method-dec": [
    { rank: 1, username: "DecisionMaster", points: 890, accuracy: 75, avatarUrl: "" },
    { rank: 2, username: "PointsFighter", points: 860, accuracy: 73, avatarUrl: "" },
    { rank: 3, username: "JudgeWhisperer", points: 830, accuracy: 71, avatarUrl: "" },
    { rank: 4, username: "ScorecardSage", points: 800, accuracy: 69, avatarUrl: "" },
    { rank: 5, username: "VerdictVirtuoso", points: 780, accuracy: 68, avatarUrl: "" },
  ],
  // Round-based leaderboards
  "round-1": [
    { rank: 1, username: "FirstRoundFinisher", points: 420, accuracy: 65, avatarUrl: "" },
    { rank: 2, username: "FastStarter", points: 390, accuracy: 63, avatarUrl: "" },
    { rank: 3, username: "QuickKO", points: 360, accuracy: 61, avatarUrl: "" },
    { rank: 4, username: "R1Prophet", points: 340, accuracy: 60, avatarUrl: "" },
    { rank: 5, username: "EarlyEnder", points: 320, accuracy: 58, avatarUrl: "" },
  ],
  "round-2": [
    { rank: 1, username: "R2Expert", points: 380, accuracy: 64, avatarUrl: "" },
    { rank: 2, username: "SecondRoundSage", points: 350, accuracy: 62, avatarUrl: "" },
    { rank: 3, username: "MiddleManiac", points: 330, accuracy: 60, avatarUrl: "" },
    { rank: 4, username: "Round2Ruler", points: 310, accuracy: 59, avatarUrl: "" },
    { rank: 5, username: "R2Oracle", points: 290, accuracy: 57, avatarUrl: "" },
  ],
  "round-3": [
    { rank: 1, username: "ThirdRoundThriller", points: 360, accuracy: 63, avatarUrl: "" },
    { rank: 2, username: "LateFinisher", points: 340, accuracy: 61, avatarUrl: "" },
    { rank: 3, username: "R3Specialist", points: 320, accuracy: 60, avatarUrl: "" },
    { rank: 4, username: "FinalRoundFan", points: 300, accuracy: 58, avatarUrl: "" },
    { rank: 5, username: "CloseCallKing", points: 280, accuracy: 56, avatarUrl: "" },
  ],
  // Weight class leaderboards
  "weight-heavyweight": [
    { rank: 1, username: "HeavyweightHero", points: 480, accuracy: 71, avatarUrl: "" },
    { rank: 2, username: "BigManBoss", points: 450, accuracy: 69, avatarUrl: "" },
    { rank: 3, username: "PowerPredictor", points: 420, accuracy: 67, avatarUrl: "" },
    { rank: 4, username: "HWExpert", points: 400, accuracy: 66, avatarUrl: "" },
    { rank: 5, username: "HeavyHitter", points: 380, accuracy: 64, avatarUrl: "" },
  ],
  "weight-lightweight": [
    { rank: 1, username: "LightweightLegend", points: 520, accuracy: 74, avatarUrl: "" },
    { rank: 2, username: "155Master", points: 490, accuracy: 72, avatarUrl: "" },
    { rank: 3, username: "LWOracle", points: 460, accuracy: 70, avatarUrl: "" },
    { rank: 4, username: "QuickPicks", points: 440, accuracy: 69, avatarUrl: "" },
    { rank: 5, username: "SpeedySelector", points: 420, accuracy: 67, avatarUrl: "" },
  ],
  "weight-welterweight": [
    { rank: 1, username: "WelterweightWiz", points: 500, accuracy: 73, avatarUrl: "" },
    { rank: 2, username: "170Pro", points: 470, accuracy: 71, avatarUrl: "" },
    { rank: 3, username: "WWChamp", points: 450, accuracy: 70, avatarUrl: "" },
    { rank: 4, username: "WelterExpert", points: 430, accuracy: 68, avatarUrl: "" },
    { rank: 5, username: "MidWeightMaster", points: 410, accuracy: 66, avatarUrl: "" },
  ],
};

const tabConfig = [
  { value: "global", label: "Global", icon: Trophy },
  { value: "mainEvents", label: "Main Events", icon: Crown },
  { value: "mainCard", label: "Main Card", icon: Flame },
  { value: "prelims", label: "Prelims", icon: Star },
  { value: "earlyPrelims", label: "Early", icon: Zap },
];

export function LeaderboardsPage() {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("global");
  const [advancedFilter, setAdvancedFilter] = useState<{
    method?: "KO/TKO" | "SUB" | "DEC"
    round?: 1 | 2 | 3 | 4 | 5
    weightClass?: string
  } | null>(null);

  const getLeaderboardKey = () => {
    // Si hay filtro avanzado, usarlo
    if (advancedFilter?.method) {
      const methodKey = advancedFilter.method.toLowerCase().replace("/", "")
      return `method-${methodKey}`
    }
    if (advancedFilter?.round) {
      return `round-${advancedFilter.round}`
    }
    if (advancedFilter?.weightClass) {
      return `weight-${advancedFilter.weightClass.toLowerCase().replace(" ", "")}`
    }

    // Si no, usar tab activo
    return activeTab
  }

  const currentLeaderboard = leaderboardData[getLeaderboardKey()] || [];
  const currentUser = currentLeaderboard.find((u) => u.isCurrentUser);
  const displayUsers = currentLeaderboard.filter((u) => !u.isCurrentUser).slice(0, 10);

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Leaderboards</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[100px] bg-secondary border-border">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="ufc-310">UFC 310</SelectItem>
            <SelectItem value="ufc-309">UFC 309</SelectItem>
            <SelectItem value="ufc-308">UFC 308</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                advancedFilter && "border-primary text-primary"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced Filters
              {advancedFilter && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Victory Method</h4>
                <Select
                  value={advancedFilter?.method || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setAdvancedFilter((prev) => {
                        if (!prev) return null
                        const { method, ...rest } = prev
                        return Object.keys(rest).length > 0 ? rest : null
                      })
                    } else {
                      setAdvancedFilter((prev) => ({
                        ...prev,
                        method: value as "KO/TKO" | "SUB" | "DEC",
                        round: undefined, // Clear round when method changes
                        weightClass: undefined, // Clear weight when method changes
                      }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="KO/TKO">KO/TKO</SelectItem>
                    <SelectItem value="SUB">Submission</SelectItem>
                    <SelectItem value="DEC">Decision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Round</h4>
                <Select
                  value={advancedFilter?.round?.toString() || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setAdvancedFilter((prev) => {
                        if (!prev) return null
                        const { round, ...rest } = prev
                        return Object.keys(rest).length > 0 ? rest : null
                      })
                    } else {
                      setAdvancedFilter((prev) => ({
                        ...prev,
                        round: parseInt(value) as 1 | 2 | 3 | 4 | 5,
                        method: undefined, // Clear method when round changes
                        weightClass: undefined, // Clear weight when round changes
                      }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Rounds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rounds</SelectItem>
                    <SelectItem value="1">Round 1</SelectItem>
                    <SelectItem value="2">Round 2</SelectItem>
                    <SelectItem value="3">Round 3</SelectItem>
                    <SelectItem value="4">Round 4</SelectItem>
                    <SelectItem value="5">Round 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Weight Class</h4>
                <Select
                  value={advancedFilter?.weightClass || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setAdvancedFilter((prev) => {
                        if (!prev) return null
                        const { weightClass, ...rest } = prev
                        return Object.keys(rest).length > 0 ? rest : null
                      })
                    } else {
                      setAdvancedFilter((prev) => ({
                        ...prev,
                        weightClass: value,
                        method: undefined, // Clear method when weight changes
                        round: undefined, // Clear round when weight changes
                      }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Weight Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weight Classes</SelectItem>
                    <SelectItem value="Heavyweight">Heavyweight</SelectItem>
                    <SelectItem value="Light Heavyweight">Light Heavyweight</SelectItem>
                    <SelectItem value="Middleweight">Middleweight</SelectItem>
                    <SelectItem value="Welterweight">Welterweight</SelectItem>
                    <SelectItem value="Lightweight">Lightweight</SelectItem>
                    <SelectItem value="Featherweight">Featherweight</SelectItem>
                    <SelectItem value="Bantamweight">Bantamweight</SelectItem>
                    <SelectItem value="Flyweight">Flyweight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setAdvancedFilter(null)}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Indicator */}
      {advancedFilter && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Showing leaderboard for:{" "}
            {advancedFilter.method && `${advancedFilter.method} finishes`}
            {advancedFilter.round && `Round ${advancedFilter.round} predictions`}
            {advancedFilter.weightClass && `${advancedFilter.weightClass} fights`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdvancedFilter(null)}
            className="ml-auto h-6 px-2"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary/50 p-1 h-auto flex-wrap">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 min-w-[80px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            {/* Current User Position */}
            {currentUser && activeTab === "global" && (
              <Card className="card-gradient border-primary/30 p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-2">Your Position</p>
                <LeaderboardRow
                  rank={currentUser.rank}
                  username={currentUser.username}
                  points={currentUser.points}
                  accuracy={currentUser.accuracy}
                  isCurrentUser
                />
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="card-gradient p-4">
              <div className="space-y-1">
                {displayUsers.map((user) => (
                  <LeaderboardRow
                    key={user.rank}
                    rank={user.rank}
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    points={user.points}
                    accuracy={user.accuracy}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
