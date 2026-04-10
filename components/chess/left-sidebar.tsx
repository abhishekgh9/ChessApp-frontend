"use client"

import { 
  Swords, 
  Bot, 
  LineChart, 
  Trophy, 
  User, 
  Settings 
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface LeftSidebarProps {
  onPlayBot?: () => void
  onShowGameOver?: () => void
  onSettings?: () => void
}

export function LeftSidebar({ onPlayBot, onShowGameOver, onSettings }: LeftSidebarProps) {
  const navItems = [
    { icon: Swords, label: "Play Online", active: true, onClick: onShowGameOver },
    { icon: Bot, label: "Play Computer", active: false, onClick: onPlayBot },
    { icon: LineChart, label: "Analysis", active: false },
    { icon: Trophy, label: "Leaderboard", active: false },
    { icon: User, label: "Profile", active: false },
  ]
  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-white/5 bg-sidebar py-4">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-primary transition-transform duration-200 hover:scale-105 active:scale-95">
        <span className="text-xl font-bold text-primary-foreground">♞</span>
      </div>
      
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <button
                onClick={item.onClick}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95",
                  item.active 
                    ? "bg-sidebar-accent text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onSettings}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Settings
        </TooltipContent>
      </Tooltip>
    </aside>
  )
}
