'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Calendar,
  Target,
  CheckCircle,
  Percent,
  Trophy,
  Settings,
  LogOut,
  Camera,
  Loader2,
} from "lucide-react";
import { useCurrentUser, useLogout, useUpdateProfile } from "@/lib/hooks";
import { toast } from "sonner";

// Helper function to format numbers consistently
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function ProfilePage() {
  const router = useRouter();
  const logout = useLogout();
  const { data: user, isLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [username, setUsername] = useState("");

  // Initialize username when user data loads
  useEffect(() => {
    if (user?.name) {
      setUsername(user.name);
    }
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({ name: username.trim() });
      toast.success("Profile updated successfully");
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="card-gradient p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <UserAvatar
              src={user.profile_picture}
              name={user.name}
              size="xl"
              showRing
            />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      src={user.profile_picture}
                      name={user.name}
                      size="lg"
                    />
                    <Button variant="secondary" size="sm">
                      Change Photo
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="card-gradient p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">Total Picks</p>
            </div>
          </div>
        </Card>

        <Card className="card-gradient p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
          </div>
        </Card>

        <Card className="card-gradient p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Percent className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">-%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
          </div>
        </Card>

        <Card className="card-gradient p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ufc-red/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-ufc-red" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">Rank</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Points Card */}
      <Card className="card-gradient p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Points</p>
            <p className="text-4xl font-bold text-primary">-</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="card-gradient">
        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </Card>
    </div>
  );
}
