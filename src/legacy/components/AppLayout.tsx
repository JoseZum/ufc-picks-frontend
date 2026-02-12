'use client'

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      
      <main className="md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}
