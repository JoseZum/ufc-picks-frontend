'use client'

import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Loader2 } from "lucide-react";
import { useGoogleLogin } from "@/lib/hooks";
import { toast } from "sonner";

export function AuthPage() {
  const router = useRouter();
  const googleLoginMutation = useGoogleLogin();

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error("Failed to get Google credentials");
      return;
    }

    try {
      await googleLoginMutation.mutateAsync(response.credential);
      toast.success("Welcome to UFC Picks!");
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google Sign-In failed");
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fighter-red/20 rounded-full blur-3xl"
          style={{
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fighter-blue/20 rounded-full blur-3xl"
          style={{
            animation: 'float 15s ease-in-out infinite reverse'
          }}
        />

        {/* Animated Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50"
            style={{
              animation: 'bounce-slow 3s ease-in-out infinite'
            }}
          >
            <Flame className="h-12 w-12 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              UFC Picks
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Compete. Predict. Win.</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="card-gradient p-8 border-border/50 shadow-2xl backdrop-blur-sm bg-background/80">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Welcome</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to start making your fight predictions
              </p>
            </div>

            {/* Google Auth Button */}
            <div className="flex justify-center">
              {googleLoginMutation.isPending ? (
                <Button
                  variant="outline"
                  className="w-full gap-3 h-12 text-base font-medium border-2"
                  disabled
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </Button>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  width="320"
                  text="continue_with"
                  shape="rectangular"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
