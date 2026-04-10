"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { useAuth } from "./auth-context"
import { useGame } from "./game-context"

interface PlayBotModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const difficultyLevels = [
  { level: 1, label: "Beginner", elo: "400-600", color: "bg-chart-2" },
  { level: 2, label: "Casual", elo: "700-900", color: "bg-chart-2" },
  { level: 3, label: "Intermediate", elo: "1000-1200", color: "bg-chart-3" },
  { level: 4, label: "Club Player", elo: "1300-1500", color: "bg-chart-3" },
  { level: 5, label: "Advanced", elo: "1600-1800", color: "bg-chart-5" },
  { level: 6, label: "Expert", elo: "1900-2100", color: "bg-chart-5" },
  { level: 7, label: "Master", elo: "2200-2500", color: "bg-chart-4" },
  { level: 8, label: "Engine Room", elo: "2600-2800", color: "bg-chart-4" },
  { level: 9, label: "Super GM", elo: "2900-3100", color: "bg-destructive" },
  { level: 10, label: "Maximum", elo: "3200+", color: "bg-destructive" },
]

export function PlayBotModal({ open, onOpenChange }: PlayBotModalProps) {
  const { startBotGame } = useGame()
  const { isAuthenticated, openAuthModal } = useAuth()
  const [selectedLevel, setSelectedLevel] = useState(difficultyLevels[2].level)
  const [selectedColor, setSelectedColor] = useState<"white" | "black" | "random">("random")

  const handleStart = async () => {
    if (!isAuthenticated) {
      openAuthModal("register")
      toast.info("Create an account to save your bot games and preferences.")
      return
    }

    const level = difficultyLevels.find((item) => item.level === selectedLevel) ?? difficultyLevels[2]
    const started = await startBotGame({
      level: level.level,
      label: level.label,
      color: selectedColor,
    })
    if (started) {
      toast.success(`Started bot game against ${level.label}.`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 animate-fade-in-scale">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Play Against Bot</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Choose a level and seat color, then launch a fresh bot game.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 py-4">
          {difficultyLevels.map((diff, idx) => (
            <Button
              key={diff.level}
              variant="secondary"
              className={cn(
                "h-auto flex-col items-start gap-0.5 border p-3 transition-all duration-200 active:scale-[0.97]",
                selectedLevel === diff.level
                  ? "border-primary/50 bg-primary/15"
                  : "border-white/5 hover:border-primary/50 hover:bg-secondary/80",
                "animate-slide-up",
              )}
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => setSelectedLevel(diff.level)}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold">Level {diff.level}</span>
                <div className={cn("h-2 w-2 rounded-full", diff.color)} />
              </div>
              <span className="text-xs text-slate-400">{diff.label}</span>
              <span className="text-xs tabular-nums text-slate-500">ELO: {diff.elo}</span>
            </Button>
          ))}
        </div>

        <div className="border-t border-white/5 pt-4">
          <span className="text-sm text-slate-400">Play as:</span>
          <div className="mt-3 flex gap-2">
            {(["white", "black", "random"] as const).map((color) => (
              <Button
                key={color}
                variant="outline"
                size="sm"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "gap-2 border-white/10 transition-all duration-200 active:scale-95 hover:bg-secondary/80",
                  selectedColor === color && "border-primary/50 bg-primary/15 text-primary",
                )}
              >
                {color === "white" ? <span className="text-lg">{"\u2654"}</span> : color === "black" ? <span className="text-lg">{"\u265A"}</span> : null}
                {color[0].toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Button className="mt-2 h-12 w-full rounded-2xl" onClick={handleStart}>
          Start bot game
        </Button>
      </DialogContent>
    </Dialog>
  )
}
