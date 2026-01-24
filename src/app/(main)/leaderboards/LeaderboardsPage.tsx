'use client'

import { useState } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Crown, Star } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useGlobalLeaderboard, useCategoryLeaderboard, useMyLeaderboardPosition } from "@/lib/hooks";

type LeaderboardCategory = 'global' | 'main_events' | 'main_card' | 'prelims' | 'early_prelims';

export function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('global');
  const [yearFilter, setYearFilter] = useState<string>("all");

  const year = yearFilter === "all" ? undefined : parseInt(yearFilter);

  const { data: leaderboard, isLoading } = activeTab === 'global' 
    ? useGlobalLeaderboard({ year, limit: 100 })
    : useCategoryLeaderboard(activeTab, { year, limit: 100 });

  const { data: myPosition } = useMyLeaderboardPosition(activeTab);

  const getCategoryIcon = (category: LeaderboardCategory) => {
    switch (category) {
      case 'global': return <Trophy className="h-4 w-4" />;
      case 'main_events': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getCategoryTitle = (category: LeaderboardCategory) => {
    return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Trophy className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-2xl">Leaderboards</h1>
          <p className="text-sm text-muted-foreground">See how you stack up</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardCategory)}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="global" className="gap-2">
            {getCategoryIcon('global')}
            <span className="hidden sm:inline">Global</span>
          </TabsTrigger>
          <TabsTrigger value="main_events" className="gap-2">
            {getCategoryIcon('main_events')}
            <span className="hidden sm:inline">Main Events</span>
          </TabsTrigger>
          <TabsTrigger value="main_card" className="gap-2">
            {getCategoryIcon('main_card')}
            <span className="hidden sm:inline">Main Card</span>
          </TabsTrigger>
          <TabsTrigger value="prelims" className="gap-2">
            {getCategoryIcon('prelims')}
            <span className="hidden sm:inline">Prelims</span>
          </TabsTrigger>
          <TabsTrigger value="early_prelims" className="gap-2">
            {getCategoryIcon('early_prelims')}
            <span className="hidden sm:inline">Early</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card className="card-gradient p-4">
            <div className="flex items-center gap-2 mb-4">
              {getCategoryIcon(activeTab)}
              <h2 className="font-semibold">{getCategoryTitle(activeTab)}</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-1">
                {leaderboard.map((user) => (
                  <LeaderboardRow
                    key={user.user_id}
                    rank={user.rank}
                    username={user.username}
                    avatarUrl={user.avatar_url}
                    points={user.total_points}
                    accuracy={Math.round(user.accuracy * 100)}
                    isCurrentUser={myPosition?.entry?.user_id === user.user_id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No leaderboard data available yet</p>
                <p className="text-sm">Make some picks to get started!</p>
              </div>
            )}
          </Card>

          {myPosition?.entry && (
            <Card className="card-gradient p-4 border-primary/30">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Your Position</h3>
              <LeaderboardRow
                rank={myPosition.rank!}
                username={myPosition.entry.username}
                avatarUrl={myPosition.entry.avatar_url}
                points={myPosition.entry.total_points}
                accuracy={Math.round(myPosition.entry.accuracy * 100)}
                isCurrentUser={true}
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
