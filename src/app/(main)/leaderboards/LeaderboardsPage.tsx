'use client'

import { useState, useMemo } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Crown, Star } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useGlobalLeaderboard, useCategoryLeaderboard, useMyLeaderboardPosition } from "@/lib/hooks";

type LeaderboardCategory = 'global' | 'main_events' | 'main_card' | 'prelims';
type SortBy = 'points' | 'accuracy' | 'correct_picks' | 'perfect_picks' | 'total_picks';

export function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('global');
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>('points');

  const year = yearFilter === "all" ? undefined : parseInt(yearFilter);

  const { data: leaderboard, isLoading } = activeTab === 'global' 
    ? useGlobalLeaderboard({ year, limit: 100 })
    : useCategoryLeaderboard(activeTab, { year, limit: 100 });

  const { data: myPosition } = useMyLeaderboardPosition(activeTab);
  
  // Sort leaderboard based on selected criteria
  const sortedLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    
    const sorted = [...leaderboard];
    
    switch (sortBy) {
      case 'points':
        sorted.sort((a, b) => b.total_points - a.total_points);
        break;
      case 'accuracy':
        sorted.sort((a, b) => {
          // Sort by accuracy first, then by correct picks as tiebreaker
          if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy;
          }
          return b.picks_correct - a.picks_correct;
        });
        break;
      case 'correct_picks':
        sorted.sort((a, b) => b.picks_correct - a.picks_correct);
        break;
      case 'perfect_picks':
        sorted.sort((a, b) => {
          // Sort by perfect picks, then by total points as tiebreaker
          if (b.perfect_picks !== a.perfect_picks) {
            return b.perfect_picks - a.perfect_picks;
          }
          return b.total_points - a.total_points;
        });
        break;
      case 'total_picks':
        sorted.sort((a, b) => b.picks_total - a.picks_total);
        break;
    }
    
    return sorted;
  }, [leaderboard, sortBy]);
  
  // Year options (only 2026)
  const yearOptions = [
    { value: "all", label: "All Time" },
    { value: "2026", label: "2026" },
  ];
  
  // Sort options
  const sortOptions = [
    { value: "points", label: "Total Points" },
    { value: "accuracy", label: "Best Accuracy" },
    { value: "correct_picks", label: "Most Correct" },
    { value: "perfect_picks", label: "Perfect Picks (3pts)" },
    { value: "total_picks", label: "Most Active" },
  ];

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

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[180px] bg-secondary border-border">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardCategory)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
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
            ) : sortedLeaderboard && sortedLeaderboard.length > 0 ? (
              <div className="space-y-1">
                {sortedLeaderboard.map((user, index) => (
                  <LeaderboardRow
                    key={user.user_id}
                    rank={index + 1}
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
