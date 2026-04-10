"use client"

import { useMemo } from "react"
import { Trophy, Target, Flame, Shield, Zap, Crown, Star, Award, Medal, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for Elo progression
const eloHistory = [
  { month: "Jan", rating: 1200 },
  { month: "Feb", rating: 1245 },
  { month: "Mar", rating: 1180 },
  { month: "Apr", rating: 1320 },
  { month: "May", rating: 1290 },
  { month: "Jun", rating: 1410 },
  { month: "Jul", rating: 1385 },
  { month: "Aug", rating: 1450 },
  { month: "Sep", rating: 1520 },
  { month: "Oct", rating: 1485 },
  { month: "Nov", rating: 1560 },
  { month: "Dec", rating: 1612 },
]

const gameStats = {
  wins: 156,
  draws: 42,
  losses: 89,
}

const achievements = [
  { id: 1, name: "First Victory", icon: Trophy, unlocked: true, description: "Win your first game" },
  { id: 2, name: "Rapid Fire", icon: Zap, unlocked: true, description: "Win 10 bullet games" },
  { id: 3, name: "Tactician", icon: Target, unlocked: true, description: "Find 50 brilliant moves" },
  { id: 4, name: "Hot Streak", icon: Flame, unlocked: true, description: "Win 5 games in a row" },
  { id: 5, name: "Defender", icon: Shield, unlocked: true, description: "Draw from a losing position" },
  { id: 6, name: "Rising Star", icon: Star, unlocked: true, description: "Reach 1500 rating" },
  { id: 7, name: "Champion", icon: Crown, unlocked: false, description: "Reach 2000 rating" },
  { id: 8, name: "Grandmaster", icon: Award, unlocked: false, description: "Reach 2500 rating" },
  { id: 9, name: "Legend", icon: Medal, unlocked: false, description: "Win 1000 games" },
]

export function ProfileView() {
  const total = gameStats.wins + gameStats.draws + gameStats.losses
  const winPercent = (gameStats.wins / total) * 100
  const drawPercent = (gameStats.draws / total) * 100
  const lossPercent = (gameStats.losses / total) * 100

  // Calculate SVG path for donut chart
  const donutSegments = useMemo(() => {
    const segments = []
    let currentAngle = -90 // Start from top

    const createArc = (percentage: number, color: string) => {
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1 = 50 + 35 * Math.cos(startRad)
      const y1 = 50 + 35 * Math.sin(startRad)
      const x2 = 50 + 35 * Math.cos(endRad)
      const y2 = 50 + 35 * Math.sin(endRad)

      const largeArc = angle > 180 ? 1 : 0

      return {
        path: `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color,
      }
    }

    segments.push(createArc(winPercent, "var(--primary)"))
    segments.push(createArc(drawPercent, "var(--muted-foreground)"))
    segments.push(createArc(lossPercent, "var(--destructive)"))

    return segments
  }, [winPercent, drawPercent, lossPercent])

  // Calculate line chart points
  const chartPoints = useMemo(() => {
    const minRating = Math.min(...eloHistory.map(e => e.rating)) - 50
    const maxRating = Math.max(...eloHistory.map(e => e.rating)) + 50
    const range = maxRating - minRating

    return eloHistory.map((point, idx) => ({
      x: (idx / (eloHistory.length - 1)) * 100,
      y: 100 - ((point.rating - minRating) / range) * 100,
      rating: point.rating,
      month: point.month,
    }))
  }, [])

  const polylinePoints = chartPoints.map(p => `${p.x},${p.y}`).join(" ")

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground">
          M
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">MagnusFan2024</h2>
          <p className="text-muted-foreground">Member since January 2024</p>
        </div>
      </div>

      {/* Rating Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Rating Progression</h3>
        <div className="relative h-48">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
            
            {/* Area fill */}
            <polygon
              fill="url(#ratingGradient)"
              points={`0,100 ${polylinePoints} 100,100`}
            />
            
            {/* Line */}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              points={polylinePoints}
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Current rating badge */}
          <div className="absolute right-0 top-0 rounded-lg bg-primary px-3 py-1">
            <span className="text-lg font-bold text-primary-foreground">1612</span>
          </div>
          
          {/* Month labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {eloHistory.filter((_, i) => i % 3 === 0).map(e => (
              <span key={e.month}>{e.month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Win/Draw/Loss Donut */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Game Results</h3>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {donutSegments.map((segment, idx) => (
                  <path key={idx} d={segment.path} fill={segment.color} />
                ))}
                <circle cx="50" cy="50" r="20" fill="var(--card)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{total}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-foreground">{gameStats.wins} Wins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span className="text-foreground">{gameStats.draws} Draws</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-foreground">{gameStats.losses} Losses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(winPercent)}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">7</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">12</div>
              <div className="text-xs text-muted-foreground">Brilliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">89.2%</div>
              <div className="text-xs text-muted-foreground">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "group relative flex flex-col items-center rounded-lg border p-3 transition-all",
                achievement.unlocked
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                  : "border-border bg-secondary/30 opacity-50"
              )}
            >
              <div
                className={cn(
                  "mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                  achievement.unlocked
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {achievement.unlocked ? (
                  <achievement.icon className="h-5 w-5" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <span className="text-center text-xs font-medium text-foreground">
                {achievement.name}
              </span>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg group-hover:block">
                {achievement.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
