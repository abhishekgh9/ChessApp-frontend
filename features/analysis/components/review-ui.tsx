import type { ReactNode } from "react"
import { Square } from "chess.js"

import { InsetPanel, MetricCard, PanelHeader, ProductPanel } from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PostGameAnalysisPlayerSummary, PostGameAnalysisResponse } from "@/lib/backend"

export type BoardArrow = [Square, Square, string?]

export function AnalysisPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <ProductPanel className="p-5">
      <PanelHeader title={title} description={description} />
      <div className="mt-4">{children}</div>
    </ProductPanel>
  )
}

export function formatEval(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`
}

export function formatAccuracy(value: number) {
  return `${value.toFixed(2)}%`
}

export function formatRatingDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`
}

export function formatResult(result: PostGameAnalysisResponse["result"]) {
  if (result === "WHITE_WIN") return "White won"
  if (result === "BLACK_WIN") return "Black won"
  return "Draw"
}

export function classificationTone(classification: string) {
  switch (classification) {
    case "best":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
    case "excellent":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300"
    case "good":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
    case "inaccuracy":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300"
    case "mistake":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300"
    case "blunder":
      return "border-red-400/20 bg-red-400/10 text-red-300"
    default:
      return "border-white/10 bg-white/[0.04] text-slate-300"
  }
}

export function classificationAccent(classification: string) {
  switch (classification) {
    case "best":
      return {
        label: "Best",
        badgeClassName: "border-cyan-300/30 bg-cyan-300 text-slate-950",
        arrowColor: "rgba(34, 211, 238, 0.92)",
        squareColor: "rgba(34, 211, 238, 0.34)",
      }
    case "excellent":
      return {
        label: "Excellent",
        badgeClassName: "border-sky-300/30 bg-sky-300 text-slate-950",
        arrowColor: "rgba(56, 189, 248, 0.92)",
        squareColor: "rgba(56, 189, 248, 0.32)",
      }
    case "good":
      return {
        label: "Good",
        badgeClassName: "border-emerald-300/30 bg-emerald-300 text-slate-950",
        arrowColor: "rgba(52, 211, 153, 0.92)",
        squareColor: "rgba(52, 211, 153, 0.32)",
      }
    case "inaccuracy":
      return {
        label: "Inaccuracy",
        badgeClassName: "border-amber-300/30 bg-amber-300 text-slate-950",
        arrowColor: "rgba(251, 191, 36, 0.92)",
        squareColor: "rgba(251, 191, 36, 0.34)",
      }
    case "mistake":
      return {
        label: "Mistake",
        badgeClassName: "border-orange-300/30 bg-orange-300 text-slate-950",
        arrowColor: "rgba(251, 146, 60, 0.92)",
        squareColor: "rgba(251, 146, 60, 0.34)",
      }
    case "blunder":
      return {
        label: "Blunder",
        badgeClassName: "border-red-300/30 bg-red-300 text-slate-950",
        arrowColor: "rgba(248, 113, 113, 0.94)",
        squareColor: "rgba(248, 113, 113, 0.34)",
      }
    default:
      return {
        label: classification,
        badgeClassName: "border-white/10 bg-white text-slate-950",
        arrowColor: "rgba(255, 255, 255, 0.92)",
        squareColor: "rgba(255, 255, 255, 0.28)",
      }
  }
}

export function parseUciMove(uciMove: string) {
  const normalized = uciMove.trim().toLowerCase()
  if (normalized.length < 4) {
    return null
  }

  return {
    from: normalized.slice(0, 2) as Square,
    to: normalized.slice(2, 4) as Square,
    promotion: normalized.length > 4 ? normalized.slice(4, 5) : undefined,
  }
}

export function PlayerSummaryCard({
  title,
  summary,
  highlighted = false,
}: {
  title: string
  summary: PostGameAnalysisPlayerSummary
  highlighted?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        highlighted ? "border-primary/25 bg-primary/10" : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-300">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{summary.color}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
          {summary.movesAnalyzed} moves
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCard label="Accuracy" value={formatAccuracy(summary.accuracy)} />
        <MetricCard label="Current rating" value={summary.currentRating} />
        <MetricCard label="Performance rating" value={summary.provisionalRating} />
        <MetricCard label="Rating delta" value={formatRatingDelta(summary.ratingDelta)} />
      </div>
    </div>
  )
}

export function PostGameErrorState({
  code,
  message,
  onSignIn,
}: {
  code: string | null
  message: string
  onSignIn: () => void
}) {
  const isRestricted = code === "not_game_participant"
  const requiresFinishedGame = code === "game_analysis_requires_finished_game"
  const requiresAuth = code === "unauthorized"
  const isEngineIssue =
    code === "stockfish_unavailable" || code === "stockfish_timeout" || code === "game_contains_illegal_moves"

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        isRestricted || requiresFinishedGame || requiresAuth
          ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
          : isEngineIssue
            ? "border-red-400/20 bg-red-400/10 text-red-100"
            : "border-white/10 bg-black/20 text-slate-200",
      )}
    >
      <p className="text-base font-semibold text-white">
        {requiresAuth
          ? "Sign in required"
          : isRestricted
            ? "Access restricted"
            : requiresFinishedGame
              ? "Finished game required"
              : isEngineIssue
                ? "Analysis unavailable"
                : "Unable to load analysis"}
      </p>
      <p className="mt-2 text-sm">{message}</p>
      {requiresAuth ? (
        <Button onClick={onSignIn} className="mt-4 rounded-2xl">
          Sign in
        </Button>
      ) : null}
    </div>
  )
}
