"use client"

import { Swords, Bot, LineChart, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  onPlayBot?: () => void
  onShowGameOver?: () => void
}

const navItems = [
  { icon: Swords, label: "Play", active: true, action: "gameOver" },
  { icon: Bot, label: "Bot", active: false, action: "playBot" },
  { icon: LineChart, label: "Analysis", active: false },
  { icon: Trophy, label: "Ranking", active: false },
  { icon: User, label: "Profile", active: false },
]

export function MobileNav({ onPlayBot, onShowGameOver }: MobileNavProps) {
  const handleClick = (action?: string) => {
    if (action === "playBot" && onPlayBot) {
      onPlayBot()
    } else if (action === "gameOver" && onShowGameOver) {
      onShowGameOver()
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleClick(item.action)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 active:scale-95",
              item.active 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
