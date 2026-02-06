'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Home, Calendar, Target, Trophy, User, Shield } from "lucide-react"
import { useCurrentUser } from "@/lib/hooks"
import { UI_VERSION } from '@/config/uiVersion'

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/my-picks", icon: Target, label: "Picks" },
  { href: "/leaderboards", icon: Trophy, label: "Ranks" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: user } = useCurrentUser()

  // Add admin to nav items if user is admin
  const displayItems = user?.is_admin
    ? [...navItems.slice(0, 4), { href: "/admin", icon: Shield, label: "Admin" }]
    : navItems

  const isV2 = UI_VERSION === 'v2'

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[1001] md:hidden",
        isV2
          ? "bg-[#0f0f0f] border-t-[3px] border-[#333]"
          : "bg-card/95 backdrop-blur-lg border-t border-border"
      )}
    >
      <div className="flex items-center justify-around h-14">
        {displayItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isV2
                  ? isActive
                    ? "text-[#e10600] border-t-2 border-[#e10600]"
                    : "text-[#888] hover:text-white"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn(
                "text-[10px] font-semibold tracking-wider",
                isV2 && "font-mono uppercase"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
