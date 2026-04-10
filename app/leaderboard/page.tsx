"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  Filter,
  Medal,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { leaderboardApi, LeaderboardEntry } from "@/lib/backend"
import { cn } from "@/lib/utils"

function RankBadge({ rank }: { rank: number }) {
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

function RatingChange({ change }: { change: number }) {
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

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")
  const [timeControl, setTimeControl] = useState("blitz")
  const [players, setPlayers] = useState<LeaderboardEntry[]>([])
  const [visibleCount, setVisibleCount] = useState(12)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    void leaderboardApi
      .list(submittedQuery || undefined)
      .then((response) => {
        if (cancelled) return
        setPlayers(response)
      })
      .catch(() => {
        if (cancelled) return
        setPlayers([])
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [submittedQuery])

  const visiblePlayers = useMemo(() => players.slice(0, visibleCount), [players, visibleCount])

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-24">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.24)] lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Global rankings</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Leaderboard now uses live backend data</h2>
              <p className="mt-2 text-sm text-slate-400">
                Time-control tabs are preserved in the UI, but the backend currently serves one shared leaderboard regardless of tab.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setSubmittedQuery(searchQuery.trim())}
                  className="h-12 rounded-2xl border-white/10 bg-black/20 pl-11 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                variant="secondary"
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                onClick={() => setSubmittedQuery(searchQuery.trim())}
              >
                <Filter className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <Tabs value={timeControl} onValueChange={setTimeControl}>
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-[20px] border border-white/10 bg-black/20 p-1 sm:grid-cols-4 lg:w-[480px]">
                <TabsTrigger value="bullet" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Bullet</TabsTrigger>
                <TabsTrigger value="blitz" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Blitz</TabsTrigger>
                <TabsTrigger value="rapid" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Rapid</TabsTrigger>
                <TabsTrigger value="classical" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Classical</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_28px_70px_rgba(0,0,0,0.24)] lg:p-5">
          <div className="mb-3 hidden grid-cols-[100px_minmax(0,1.6fr)_140px_140px_140px_120px] gap-3 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 xl:grid">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Rating</span>
            <span className="text-right">Change</span>
            <span className="text-right">Games</span>
            <span className="text-right">Win rate</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-[26px] border border-white/10 bg-black/20 p-6 text-center text-slate-400">
                Loading leaderboard...
              </div>
            ) : visiblePlayers.length === 0 ? (
              <div className="rounded-[26px] border border-white/10 bg-black/20 p-6 text-center text-slate-400">
                No leaderboard entries matched this search.
              </div>
            ) : (
              visiblePlayers.map((player) => (
                <article
                  key={`${player.rank}-${player.username}`}
                  className={cn(
                    "rounded-[26px] border p-4 transition-colors hover:bg-white/[0.05] xl:grid xl:grid-cols-[100px_minmax(0,1.6fr)_140px_140px_140px_120px] xl:items-center xl:gap-3",
                    player.rank <= 3 ? "border-primary/20 bg-primary/[0.06]" : "border-white/10 bg-black/20",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RankBadge rank={player.rank} />
                    <div className="xl:hidden">
                      <p className="text-sm text-slate-500">Rank #{player.rank}</p>
                      <p className="text-base font-semibold text-white">{player.username}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 xl:mt-0">
                    <Avatar className="h-12 w-12 border border-white/10">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="bg-white/10 text-slate-100">
                        {player.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {player.title && (
                          <span className="rounded-full border border-primary/20 bg-primary/12 px-2 py-0.5 text-xs font-semibold text-primary">
                            {player.title}
                          </span>
                        )}
                        <p className="truncate font-semibold text-white">{player.username}</p>
                      </div>
                      <p className="text-sm text-slate-400">{player.country ?? "Unknown country"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm xl:mt-0 xl:block xl:text-right">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">Rating</p>
                      <p className="text-lg font-semibold text-white">{player.rating}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">Change</p>
                      <RatingChange change={player.change} />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">Games</p>
                      <p className="text-white">{player.gamesPlayed.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">Win rate</p>
                      <p className="text-white">{player.winRate}%</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-5 flex justify-center">
            <Button
              variant="secondary"
              className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
              onClick={() => setVisibleCount((count) => count + 12)}
              disabled={visibleCount >= players.length}
            >
              Load more
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
