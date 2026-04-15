import { Medal, Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react"

import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { FideLeaderboardEntry } from "@/lib/backend"

export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-400/15">
        <Trophy className="h-5 w-5 text-yellow-300" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300/25 bg-slate-300/10">
        <Medal className="h-5 w-5 text-slate-200" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
        <Medal className="h-5 w-5 text-amber-300" />
      </div>
    )
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-slate-300">
      {rank}
    </div>
  )
}

export function RatingChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <TrendingUp className="h-3 w-3" />
        +{change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-300">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400">
      <Minus className="h-3 w-3" />
      0
    </span>
  )
}

export function FideTableRow({ player }: { player: FideLeaderboardEntry }) {
  return (
    <TableRow className="border-white/10 hover:bg-white/[0.04]">
      <TableCell className="font-semibold text-white">{player.rank}</TableCell>
      <TableCell className="min-w-[220px]">
        <div className="flex flex-col">
          <span className="font-semibold text-white">{player.name}</span>
          <span className="text-xs text-slate-400">FIDE ID {player.fideId}</span>
        </div>
      </TableCell>
      <TableCell className="text-slate-300">{player.title ?? "-"}</TableCell>
      <TableCell className="text-slate-300">{player.country ?? "-"}</TableCell>
      <TableCell className="text-right font-semibold text-white">{player.rating}</TableCell>
      <TableCell className="text-right text-slate-300">{player.gamesPlayed ?? "-"}</TableCell>
      <TableCell className="text-slate-300">{player.gender ?? "-"}</TableCell>
      <TableCell className="text-slate-300">{player.birthYear ?? "-"}</TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
            player.inactive
              ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
          )}
        >
          {player.inactive ? "Inactive" : "Active"}
        </span>
      </TableCell>
    </TableRow>
  )
}
