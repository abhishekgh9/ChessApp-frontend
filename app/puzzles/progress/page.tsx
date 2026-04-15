"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { useAuth } from "@/components/chess/auth-context"
import { InsetPanel, MetricCard, ProductPanel } from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BackendError, PuzzleProgressResponse, getErrorMessage, puzzlesApi } from "@/lib/backend"

export default function PuzzleProgressPage() {
  const { token, isAuthenticated, openAuthModal } = useAuth()
  const [progress, setProgress] = useState<PuzzleProgressResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setProgress(null)
      setErrorMessage(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorMessage(null)

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
          setErrorMessage("Sign in to view your puzzle progress.")
          return
        }
        setErrorMessage(getErrorMessage(error, "Unable to load puzzle progress."))
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, token])

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-24">
        <ProductPanel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-eyebrow">Account metrics</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Puzzle progress</h2>
              <p className="mt-2 text-sm text-muted-foreground">Solved count, attempts, and streak tracking from your backend profile.</p>
            </div>
            <Button asChild variant="outline" className="control-base rounded-xl text-white hover:bg-white/10">
              <Link href="/puzzles">
                <ArrowLeft className="h-4 w-4" />
                Back to puzzles
              </Link>
            </Button>
          </div>

          {!isAuthenticated ? (
            <InsetPanel className="mt-5 p-4">
              <p className="text-sm text-slate-300">You need to be signed in to access puzzle progress.</p>
              <Button onClick={() => openAuthModal("login")} className="mt-3 rounded-xl">
                Sign in
              </Button>
            </InsetPanel>
          ) : isLoading ? (
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-300">
              <Spinner className="h-4 w-4" />
              Loading progress...
            </div>
          ) : errorMessage ? (
            <InsetPanel className="mt-5 border border-red-400/20 p-4">
              <p className="text-sm text-red-200">{errorMessage}</p>
              <Button className="mt-3 rounded-xl" variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </InsetPanel>
          ) : progress ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricCard label="Attempted" value={progress.attemptedCount} />
              <MetricCard label="Solved" value={progress.solvedCount} />
              <MetricCard label="Success rate" value={`${progress.successRate.toFixed(1)}%`} />
              <MetricCard label="Current streak" value={progress.currentStreak} />
              <MetricCard label="Best streak" value={progress.bestStreak} />
            </div>
          ) : (
            <InsetPanel className="mt-5 p-4 text-sm text-slate-300">No progress yet. Solve a puzzle to get started.</InsetPanel>
          )}
        </ProductPanel>
      </div>
    </AppLayout>
  )
}
