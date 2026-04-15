"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Target } from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { useAuth } from "@/components/chess/auth-context"
import { DataPill, InsetPanel, MetricCard, ProductPanel } from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  BackendError,
  DailyPuzzleResponse,
  PuzzleDifficulty,
  PuzzleListResponse,
  PuzzleProgressResponse,
  getErrorMessage,
  puzzlesApi,
} from "@/lib/backend"

const DEFAULT_PAGE_SIZE = 10

export default function PuzzleListPage() {
  const { token, isAuthenticated, openAuthModal } = useAuth()

  const [difficulty, setDifficulty] = useState<"all" | PuzzleDifficulty>("all")
  const [themeInput, setThemeInput] = useState("")
  const [themeFilter, setThemeFilter] = useState("")
  const [page, setPage] = useState(0)

  const [listData, setListData] = useState<PuzzleListResponse | null>(null)
  const [isListLoading, setIsListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzleResponse | null>(null)
  const [isDailyLoading, setIsDailyLoading] = useState(true)

  const [progress, setProgress] = useState<PuzzleProgressResponse | null>(null)
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsDailyLoading(true)

    void puzzlesApi
      .daily()
      .then((response) => {
        if (cancelled) return
        setDailyPuzzle(response)
      })
      .catch(() => {
        if (cancelled) return
        setDailyPuzzle(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsDailyLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsListLoading(true)
    setListError(null)

    void puzzlesApi
      .list({
        difficulty: difficulty === "all" ? undefined : difficulty,
        theme: themeFilter || undefined,
        page,
        size: DEFAULT_PAGE_SIZE,
      })
      .then((response) => {
        if (cancelled) return
        setListData(response)
      })
      .catch((error) => {
        if (cancelled) return
        setListData(null)
        setListError(getErrorMessage(error, "Unable to load puzzles right now."))
      })
      .finally(() => {
        if (cancelled) return
        setIsListLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [difficulty, page, themeFilter])

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setProgress(null)
      setProgressError(null)
      return
    }

    let cancelled = false
    setIsProgressLoading(true)
    setProgressError(null)

    void puzzlesApi
      .progress(token)
      .then((response) => {
        if (cancelled) return
        setProgress(response)
      })
      .catch((error) => {
        if (cancelled) return
        setProgress(null)
        if (error instanceof BackendError && error.code === "unauthorized") {
          setProgressError("Sign in to view puzzle progress.")
          return
        }
        setProgressError(getErrorMessage(error, "Unable to load puzzle progress."))
      })
      .finally(() => {
        if (cancelled) return
        setIsProgressLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, token])

  const totalPages = listData?.totalPages ?? 0
  const currentPage = listData?.page ?? page
  const hasPrev = currentPage > 0
  const hasNext = listData ? currentPage + 1 < listData.totalPages : false

  const availableThemes = useMemo(() => {
    const set = new Set<string>()
    for (const puzzle of listData?.items ?? []) {
      set.add(puzzle.primaryTheme)
      for (const tag of puzzle.tags) {
        set.add(tag)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [listData?.items])

  const applyThemeFilter = () => {
    setThemeFilter(themeInput.trim())
    setPage(0)
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-24">
        <ProductPanel strong className="p-5 lg:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div>
              <p className="section-eyebrow">Featured</p>
              <h2 className="section-title mt-2">Daily puzzle</h2>
              <p className="section-copy mt-2">A deterministic challenge for the current UTC day.</p>
            </div>

            <InsetPanel className="p-4">
              {isDailyLoading ? (
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Spinner className="h-4 w-4" />
                  Loading daily puzzle...
                </div>
              ) : dailyPuzzle ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <DataPill tone="accent">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {dailyPuzzle.dailyDate}
                    </DataPill>
                    <DataPill>{dailyPuzzle.difficulty}</DataPill>
                    <DataPill>{dailyPuzzle.primaryTheme}</DataPill>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{dailyPuzzle.title}</h3>
                  <p className="text-sm text-muted-foreground">{dailyPuzzle.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {dailyPuzzle.totalSolutionSteps} step{dailyPuzzle.totalSolutionSteps === 1 ? "" : "s"} | max wrong {dailyPuzzle.maxWrongAttempts}
                    </p>
                    <Button asChild className="rounded-xl">
                      <Link href="/puzzles/daily">Start daily</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Daily puzzle is unavailable right now.</p>
              )}
            </InsetPanel>
          </div>
        </ProductPanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ProductPanel className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-eyebrow">Browse</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Puzzle catalog</h3>
              </div>
              <Button asChild variant="outline" className="control-base text-white hover:bg-white/[0.08]">
                <Link href="/puzzles/progress">View progress</Link>
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
              <Select
                value={difficulty}
                onValueChange={(value) => {
                  setDifficulty(value as "all" | PuzzleDifficulty)
                  setPage(0)
                }}
              >
                <SelectTrigger className="control-base h-11 rounded-xl text-white">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={themeInput}
                onChange={(event) => setThemeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyThemeFilter()
                  }
                }}
                placeholder="Filter by theme or tag"
                className="control-base h-11 rounded-xl text-white placeholder:text-slate-500"
              />

              <Button onClick={applyThemeFilter} variant="secondary" className="control-base h-11 rounded-xl text-white">
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </div>

            {availableThemes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableThemes.slice(0, 12).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => {
                      setThemeInput(theme)
                      setThemeFilter(theme)
                      setPage(0)
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.07]"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-5">
              {isListLoading ? (
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Spinner className="h-4 w-4" />
                  Loading puzzles...
                </div>
              ) : listError ? (
                <InsetPanel className="border border-red-400/20 p-4 text-sm text-red-200">
                  {listError}
                </InsetPanel>
              ) : (listData?.items.length ?? 0) === 0 ? (
                <InsetPanel className="p-5">
                  <p className="text-sm text-slate-300">No puzzles found for this filter combination.</p>
                  <Button
                    className="mt-3 rounded-xl"
                    variant="outline"
                    onClick={() => {
                      setDifficulty("all")
                      setThemeInput("")
                      setThemeFilter("")
                      setPage(0)
                    }}
                  >
                    Clear filters
                  </Button>
                </InsetPanel>
              ) : (
                <div className="grid gap-3">
                  {listData?.items.map((puzzle) => (
                    <Link
                      key={puzzle.id}
                      href={`/puzzles/${puzzle.id}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-white">{puzzle.title}</h4>
                        <DataPill>{puzzle.difficulty}</DataPill>
                        <DataPill tone="accent">{puzzle.primaryTheme}</DataPill>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{puzzle.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {puzzle.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                        Steps {puzzle.totalSolutionSteps} | max wrong {puzzle.maxWrongAttempts}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Page {currentPage + 1}
                {totalPages > 0 ? ` of ${totalPages}` : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="control-base h-9 rounded-lg text-white hover:bg-white/[0.08]"
                  disabled={!hasPrev}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  className="control-base h-9 rounded-lg text-white hover:bg-white/[0.08]"
                  disabled={!hasNext}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ProductPanel>

          <ProductPanel className="p-5">
            <p className="section-eyebrow">Your stats</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Puzzle progress</h3>
            <p className="mt-2 text-sm text-muted-foreground">Attempts and streaks are tied to your account.</p>

            {!isAuthenticated ? (
              <InsetPanel className="mt-4 p-4">
                <p className="text-sm text-slate-300">Sign in to track solved count and streak metrics.</p>
                <Button onClick={() => openAuthModal("login")} className="mt-3 rounded-xl">
                  Sign in
                </Button>
              </InsetPanel>
            ) : isProgressLoading ? (
              <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                <Spinner className="h-4 w-4" />
                Loading progress...
              </div>
            ) : progressError ? (
              <InsetPanel className="mt-4 border border-red-400/20 p-4 text-sm text-red-200">{progressError}</InsetPanel>
            ) : progress ? (
              <div className="mt-4 grid gap-3">
                <MetricCard label="Solved" value={progress.solvedCount} />
                <MetricCard label="Attempted" value={progress.attemptedCount} />
                <MetricCard label="Success rate" value={`${progress.successRate.toFixed(1)}%`} />
                <MetricCard label="Current streak" value={progress.currentStreak} />
                <MetricCard label="Best streak" value={progress.bestStreak} />
              </div>
            ) : (
              <InsetPanel className="mt-4 p-4 text-sm text-slate-300">No progress data yet.</InsetPanel>
            )}

            <Button asChild variant="outline" className="control-base mt-4 w-full rounded-xl text-white hover:bg-white/[0.08]">
              <Link href="/puzzles/progress">
                <Target className="h-4 w-4" />
                Open progress page
              </Link>
            </Button>
          </ProductPanel>
        </div>
      </div>
    </AppLayout>
  )
}
