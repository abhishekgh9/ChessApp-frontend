"use client"

import { useState, useEffect } from "react"
import { X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MatchmakingOverlayProps {
  open: boolean
  onCancel: () => void
  timeControl?: string
}

export function MatchmakingOverlay({ open, onCancel, timeControl = "10+0" }: MatchmakingOverlayProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!open) {
      setSeconds(0)
      return
    }

    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [open])

  if (!open) return null

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-8 shadow-2xl animate-fade-in-scale">
        {/* Pulsating animation */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <Users className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Searching for Opponent</h2>
          <p className="mt-1 text-sm text-slate-400">
            {timeControl} Rated Game
          </p>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-secondary border border-white/5 font-mono text-2xl font-bold tabular-nums text-foreground">
            {formatTime(seconds)}
          </div>
        </div>

        {/* Rating range indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Rating Range:</span>
            <span className="font-medium tabular-nums text-foreground">
              {Math.max(1200, 1612 - Math.min(seconds * 5, 200))} - {1612 + Math.min(seconds * 5, 200)}
            </span>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.min(100, seconds * 3)}%` }}
            />
          </div>
        </div>

        {/* Players in queue */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span>{42 + Math.floor(Math.random() * 10)} players in queue</span>
        </div>

        {/* Cancel button */}
        <Button 
          variant="secondary" 
          className="mt-2 gap-2 transition-all duration-200 active:scale-95 border border-white/5"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
          Cancel Search
        </Button>
      </div>
    </div>
  )
}
