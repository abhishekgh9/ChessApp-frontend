"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { InsetPanel, ProductPanel } from "@/components/design-system/product"
import {
  FideTableRow,
  RankBadge,
  RatingChange,
} from "@/features/leaderboard/components/ranking-ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FideDivisionFilter,
  FideGenderFilter,
  FideLeaderboardResponse,
  FideTimeControl,
  LeaderboardEntry,
  leaderboardApi,
} from "@/lib/backend"
import { cn } from "@/lib/utils"

type LeaderboardSource = "app" | "fide"

type FideFilters = {
  query: string
  timeControl: FideTimeControl
  country: string
  gender: FideGenderFilter
  division: FideDivisionFilter
  page: number
  size: number
  activeOnly: boolean
}

const DEFAULT_FIDE_FILTERS: FideFilters = {
  query: "",
  timeControl: "standard",
  country: "",
  gender: "open",
  division: "open",
  page: 0,
  size: 25,
  activeOnly: true,
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default function LeaderboardPage() {
  const [source, setSource] = useState<LeaderboardSource>("app")
  const [searchQuery, setSearchQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")
  const [timeControl, setTimeControl] = useState("blitz")
  const [players, setPlayers] = useState<LeaderboardEntry[]>([])
  const [visibleCount, setVisibleCount] = useState(12)
  const [isLoading, setIsLoading] = useState(true)

  const [fideFilters, setFideFilters] = useState<FideFilters>(DEFAULT_FIDE_FILTERS)
  const [fideSearchInput, setFideSearchInput] = useState("")
  const [fideData, setFideData] = useState<FideLeaderboardResponse | null>(null)
  const [isFideLoading, setIsFideLoading] = useState(false)
  const [fideError, setFideError] = useState<string | null>(null)

  useEffect(() => {
    if (source !== "app") return

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
  }, [source, submittedQuery])

  useEffect(() => {
    if (source !== "fide") return

    let cancelled = false
    setIsFideLoading(true)
    setFideError(null)

    void leaderboardApi
      .fideList({
        query: fideFilters.query || undefined,
        timeControl: fideFilters.timeControl,
        country: fideFilters.country || undefined,
        gender: fideFilters.gender,
        division: fideFilters.division,
        page: fideFilters.page,
        size: fideFilters.size,
        activeOnly: fideFilters.activeOnly,
      })
      .then((response) => {
        if (cancelled) return
        setFideData(response)
      })
      .catch(() => {
        if (cancelled) return
        setFideData(null)
        setFideError("Unable to load FIDE leaderboard right now.")
      })
      .finally(() => {
        if (cancelled) return
        setIsFideLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [source, fideFilters])

  const visiblePlayers = useMemo(() => players.slice(0, visibleCount), [players, visibleCount])
  const totalFidePages = fideData ? Math.max(1, Math.ceil(fideData.totalEntries / fideData.size)) : 1
  const hasNextFidePage = fideData ? fideData.page + 1 < totalFidePages : false

  function updateFideFilters(patch: Partial<FideFilters>, resetPage = true) {
    setFideFilters((current) => ({
      ...current,
      ...patch,
      page: resetPage ? 0 : patch.page ?? current.page,
    }))
  }

  function submitAppSearch() {
    setSubmittedQuery(searchQuery.trim())
    setVisibleCount(12)
  }

  function submitFideSearch() {
    updateFideFilters({ query: fideSearchInput.trim() })
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-24">
        <ProductPanel strong className="p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-eyebrow">Global rankings</p>
              <h2 className="section-title mt-2">
                {source === "app" ? "Live app leaderboard" : "Official FIDE leaderboard"}
              </h2>
              <p className="section-copy mt-2">
                {source === "app"
                  ? "Search current club standings and move between the main competitive formats."
                  : "Browse official FIDE ratings with federation, division, gender, activity, and time-control filters."}
              </p>
              {source === "fide" && fideData?.lastSyncedAt && (
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Last updated {dateTimeFormatter.format(new Date(fideData.lastSyncedAt))}
                </p>
              )}
            </div>

            <div className="w-full max-w-md">
              <Tabs value={source} onValueChange={(value) => setSource(value as LeaderboardSource)}>
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
                  <TabsTrigger value="app" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    App
                  </TabsTrigger>
                  <TabsTrigger value="fide" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    FIDE
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {source === "app" ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,280px)_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitAppSearch()}
                    className="control-base h-12 rounded-xl pl-11 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button
                  variant="secondary"
                  className="control-base h-12 rounded-xl text-white hover:bg-white/[0.08]"
                  onClick={submitAppSearch}
                >
                  <Filter className="h-4 w-4" />
                  Search
                </Button>
              </div>

              <div className="mt-5">
                <Tabs value={timeControl} onValueChange={setTimeControl}>
                  <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 sm:grid-cols-4 lg:w-[480px]">
                    <TabsTrigger value="bullet" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      Bullet
                    </TabsTrigger>
                    <TabsTrigger value="blitz" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      Blitz
                    </TabsTrigger>
                    <TabsTrigger value="rapid" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      Rapid
                    </TabsTrigger>
                    <TabsTrigger value="classical" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      Classical
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="mt-5 space-y-4">
              <Tabs
                value={fideFilters.timeControl}
                onValueChange={(value) => updateFideFilters({ timeControl: value as FideTimeControl })}
              >
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1 lg:w-[420px]">
                  <TabsTrigger value="standard" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Standard
                  </TabsTrigger>
                  <TabsTrigger value="rapid" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Rapid
                  </TabsTrigger>
                  <TabsTrigger value="blitz" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Blitz
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_160px_160px_160px_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder="Search FIDE players..."
                    value={fideSearchInput}
                    onChange={(e) => setFideSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitFideSearch()}
                    className="control-base h-12 rounded-xl pl-11 text-white placeholder:text-slate-500"
                  />
                </div>

                <Input
                  placeholder="Federation code"
                  value={fideFilters.country}
                  onChange={(e) =>
                    updateFideFilters({
                      country: e.target.value.toUpperCase().slice(0, 3),
                    })
                  }
                  className="control-base h-12 rounded-xl text-white placeholder:text-slate-500"
                />

                <Select
                  value={fideFilters.gender}
                  onValueChange={(value) => updateFideFilters({ gender: value as FideGenderFilter })}
                >
                  <SelectTrigger className="control-base h-12 w-full rounded-xl text-white">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={fideFilters.division}
                  onValueChange={(value) => updateFideFilters({ division: value as FideDivisionFilter })}
                >
                  <SelectTrigger className="control-base h-12 w-full rounded-xl text-white">
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="secondary"
                  className="control-base h-12 rounded-xl text-white hover:bg-white/[0.08]"
                  onClick={submitFideSearch}
                >
                  <Filter className="h-4 w-4" />
                  Search
                </Button>
              </div>

              <InsetPanel className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <Switch
                    checked={fideFilters.activeOnly}
                    onCheckedChange={(checked) => updateFideFilters({ activeOnly: checked })}
                  />
                  Active players only
                </label>

                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span>Rows per page</span>
                  <Select
                    value={String(fideFilters.size)}
                    onValueChange={(value) => updateFideFilters({ size: Number(value) })}
                  >
                    <SelectTrigger className="control-base h-10 w-[92px] rounded-lg text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </InsetPanel>
            </div>
          )}
        </ProductPanel>

        {source === "app" ? (
          <ProductPanel className="p-4 lg:p-5">
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
          </ProductPanel>
        ) : (
          <ProductPanel className="p-4 lg:p-5">
            {isFideLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[26px] border border-white/10 bg-black/20">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Spinner className="h-4 w-4 text-primary" />
                  Loading FIDE leaderboard...
                </div>
              </div>
            ) : fideError ? (
              <Empty className="min-h-[320px] rounded-[26px] border border-white/10 bg-black/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertCircle className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-white">FIDE leaderboard unavailable</EmptyTitle>
                  <EmptyDescription className="text-slate-400">{fideError}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : !fideData || fideData.entries.length === 0 ? (
              <Empty className="min-h-[320px] rounded-[26px] border border-white/10 bg-black/20">
                <EmptyHeader>
                  <EmptyTitle className="text-white">No results</EmptyTitle>
                  <EmptyDescription className="text-slate-400">
                    No FIDE players matched these filters.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {fideData.entries.length} of {fideData.totalEntries.toLocaleString()} players
                  </p>
                  <p>
                    Page {fideData.page + 1} of {totalFidePages}
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">Rank</TableHead>
                        <TableHead className="text-slate-400">Player</TableHead>
                        <TableHead className="text-slate-400">Title</TableHead>
                        <TableHead className="text-slate-400">Federation</TableHead>
                        <TableHead className="text-right text-slate-400">Rating</TableHead>
                        <TableHead className="text-right text-slate-400">Games</TableHead>
                        <TableHead className="text-slate-400">Gender</TableHead>
                        <TableHead className="text-slate-400">Birth year</TableHead>
                        <TableHead className="text-right text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fideData.entries.map((player) => (
                        <FideTableRow key={player.fideId} player={player} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-400">
                    Filters: {fideData.timeControl}, {fideData.gender}, {fideData.division}
                    {fideData.country ? `, ${fideData.country}` : ""}
                    {fideData.query ? `, "${fideData.query}"` : ""}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="h-11 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                      onClick={() => updateFideFilters({ page: Math.max(0, fideFilters.page - 1) }, false)}
                      disabled={fideFilters.page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-11 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                      onClick={() => updateFideFilters({ page: fideFilters.page + 1 }, false)}
                      disabled={!hasNextFidePage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </ProductPanel>
        )}
      </div>
    </AppLayout>
  )
}
