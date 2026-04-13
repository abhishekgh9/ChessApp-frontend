"use client"

import Link from "next/link"
import { Crown, RotateCcw, Swords, LineChart } from "lucide-react"

import { useGame } from "@/components/chess/game-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GameOverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GameOverModal({ open, onOpenChange }: GameOverModalProps) {
  const { result, history, resetGame, exportPgn, currentGame } = useGame()
  const canAnalyzeFinishedGame = currentGame?.status === "FINISHED" && Boolean(currentGame.gameId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 animate-fade-in-scale">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Game Over</DialogTitle>
          <DialogDescription className="text-center text-base text-slate-400">
            {result?.summary ?? "The game has ended."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-4 rounded-lg border border-white/5 bg-secondary/50 px-6 py-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500">Result</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold uppercase tracking-[0.18em] text-primary">
                  {result?.reason ?? "completed"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 text-center">
            <div className="flex flex-col rounded-lg border border-white/5 bg-secondary/30 p-3">
              <span className="text-lg font-semibold tabular-nums text-foreground">{history.length}</span>
              <span className="text-xs text-slate-500">Half-moves</span>
            </div>
            <div className="flex flex-col rounded-lg border border-white/5 bg-secondary/30 p-3">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {result?.winner === "draw" ? "1/2" : result?.winner === "white" ? "1-0" : result?.winner === "black" ? "0-1" : "--"}
              </span>
              <span className="text-xs text-slate-500">Score</span>
            </div>
            <div className="flex flex-col rounded-lg border border-white/5 bg-secondary/30 p-3">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {exportPgn() ? "Saved" : "Live"}
              </span>
              <span className="text-xs text-slate-500">PGN</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full gap-2 transition-all duration-200 active:scale-[0.98]"
            onClick={() => {
              void resetGame()
              onOpenChange(false)
            }}
          >
            <Swords className="h-4 w-4" />
            New Game
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 gap-2 transition-all duration-200 active:scale-[0.98]"
              onClick={() => {
                void resetGame()
                onOpenChange(false)
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Rematch
            </Button>
            {canAnalyzeFinishedGame ? (
              <Button variant="secondary" className="flex-1 gap-2 transition-all duration-200 active:scale-[0.98]" asChild>
                <Link href={`/analysis?game=${currentGame.gameId}`}>
                  <LineChart className="h-4 w-4" />
                  Analyze
                </Link>
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1 gap-2 transition-all duration-200 active:scale-[0.98]" disabled>
                <LineChart className="h-4 w-4" />
                Analyze
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
