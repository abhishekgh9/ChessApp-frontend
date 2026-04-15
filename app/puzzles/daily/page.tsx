"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, CalendarDays } from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { DataPill, InsetPanel, ProductPanel } from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DailyPuzzleResponse, getErrorMessage, puzzlesApi } from "@/lib/backend"

export default function DailyPuzzlePage() {
  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzleResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setErrorMessage(null)

    void puzzlesApi
      .daily()
      .then((response) => {
        if (cancelled) return
        setDailyPuzzle(response)
      })
      .catch((error) => {
        if (cancelled) return
        setDailyPuzzle(null)
        setErrorMessage(getErrorMessage(error, "Unable to load daily puzzle."))
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-24">
        <ProductPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-eyebrow">Featured challenge</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Daily puzzle</h2>
              <p className="mt-2 text-sm text-muted-foreground">A deterministic puzzle selected for the current UTC day.</p>
            </div>
            <Button asChild variant="outline" className="control-base rounded-xl text-white hover:bg-white/10">
              <Link href="/puzzles">
                <ArrowLeft className="h-4 w-4" />
                Back to puzzles
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-300">
              <Spinner className="h-4 w-4" />
              Loading daily puzzle...
            </div>
          ) : errorMessage ? (
            <InsetPanel className="mt-5 border border-red-400/20 p-4 text-sm text-red-200">{errorMessage}</InsetPanel>
          ) : dailyPuzzle ? (
            <InsetPanel className="mt-5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <DataPill tone="accent">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dailyPuzzle.dailyDate}
                </DataPill>
                <DataPill>{dailyPuzzle.difficulty}</DataPill>
                <DataPill>{dailyPuzzle.primaryTheme}</DataPill>
              </div>

              <h3 className="mt-3 text-xl font-semibold text-white">{dailyPuzzle.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{dailyPuzzle.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {dailyPuzzle.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/4 px-2 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                Steps {dailyPuzzle.totalSolutionSteps} | max wrong {dailyPuzzle.maxWrongAttempts}
              </p>

              <Button asChild className="mt-4 rounded-xl">
                <Link href={`/puzzles/${dailyPuzzle.id}`}>Solve today&apos;s puzzle</Link>
              </Button>
            </InsetPanel>
          ) : (
            <InsetPanel className="mt-5 p-4 text-sm text-slate-300">No daily puzzle is available right now.</InsetPanel>
          )}
        </ProductPanel>
      </div>
    </AppLayout>
  )
}
