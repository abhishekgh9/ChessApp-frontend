"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Chessboard } from "react-chessboard"
import { AlertTriangle, CheckCircle2, Flag, Lock, RefreshCw, XCircle } from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { useAuth } from "@/components/chess/auth-context"
import { DataPill, InsetPanel, MetricCard, ProductPanel } from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  BackendError,
  PuzzleAttemptResponse,
  PuzzleSummary,
  getErrorMessage,
  puzzlesApi,
} from "@/lib/backend"

function isUciMove(value: string) {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(value)
}

function inferPromotion(piece?: string, targetSquare?: string) {
  if (!piece || !targetSquare) return ""

  const pieceType = piece[1]?.toLowerCase()
  const targetRank = targetSquare[1]
  if (pieceType !== "p") return ""

  if (targetRank === "1" || targetRank === "8") {
    return "q"
  }

  return ""
}

function statusTone(status?: PuzzleAttemptResponse["status"]) {
  if (status === "completed") return "success"
  if (status === "correct") return "accent"
  if (status === "incorrect") return "warning"
  if (status === "failed") return "danger"
  return "default"
}

export default function PuzzleSolvePage() {
  const params = useParams<{ id: string }>()
  const puzzleId = params?.id
  const { token, isAuthenticated, openAuthModal } = useAuth()

  const [puzzle, setPuzzle] = useState<PuzzleSummary | null>(null)
  const [boardFen, setBoardFen] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [uciInput, setUciInput] = useState("")
  const [hintsUsed] = useState(0)
  const [startedAtMs, setStartedAtMs] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<PuzzleAttemptResponse | null>(null)
  const [attemptMessage, setAttemptMessage] = useState<string | null>(null)
  const [attemptError, setAttemptError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    if (!puzzleId || typeof puzzleId !== "string") return

    let cancelled = false
    setIsLoading(true)
    setErrorCode(null)
    setErrorMessage(null)

    void puzzlesApi
      .detail(puzzleId)
      .then((response) => {
        if (cancelled) return
        setPuzzle(response)
        setBoardFen(response.fen)
        setStartedAtMs(Date.now())
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof BackendError) {
          setErrorCode(error.code)
        }
        setErrorMessage(getErrorMessage(error, "Unable to load this puzzle."))
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [puzzleId])

  const sendAttempt = async (rawMove: string) => {
    if (!puzzleId || typeof puzzleId !== "string") return
    if (isLocked || isSubmitting) return

    const move = rawMove.trim().toLowerCase()
    setAttemptError(null)
    setAttemptMessage(null)

    if (!isUciMove(move)) {
      setAttemptError("Use UCI format like e2e4 or a7a8q.")
      return
    }

    if (!isAuthenticated || !token) {
      setAttemptError("Sign in to submit puzzle attempts.")
      openAuthModal("login")
      return
    }

    setIsSubmitting(true)
    const timeSpentSeconds = Math.max(1, Math.floor((Date.now() - startedAtMs) / 1000))

    try {
      const response = await puzzlesApi.submitAttempt(token, puzzleId, {
        move,
        timeSpentSeconds,
        hintsUsed,
      })

      setLastAttempt(response)
      setBoardFen(response.fen)
      setAttemptMessage(response.message || `Move was ${response.status}.`)
      setUciInput("")

      if (response.completed || response.failed) {
        setIsLocked(true)
      }
    } catch (error) {
      if (error instanceof BackendError) {
        if (error.code === "puzzle_attempt_locked") {
          setIsLocked(true)
        }
        if (error.code === "unauthorized") {
          openAuthModal("login")
        }
      }
      setAttemptError(getErrorMessage(error, "Unable to submit attempt."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onPieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    const promotion = inferPromotion(piece, targetSquare)
    const uciMove = `${sourceSquare}${targetSquare}${promotion}`
    setUciInput(uciMove)
    void sendAttempt(uciMove)
    return false
  }

  const statusText = useMemo(() => {
    if (!lastAttempt) return "waiting"
    return lastAttempt.status
  }, [lastAttempt])

  const solvedSteps = lastAttempt?.solvedSteps ?? 0
  const totalSteps = lastAttempt?.totalSteps ?? puzzle?.totalSolutionSteps ?? 0
  const remainingAttempts = lastAttempt?.remainingAttempts ?? puzzle?.maxWrongAttempts ?? 0
  const attemptsUsed = lastAttempt?.attemptCount ?? 0

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 pb-24">
        {isLoading ? (
          <ProductPanel className="p-5">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Spinner className="h-4 w-4" />
              Loading puzzle...
            </div>
          </ProductPanel>
        ) : errorCode === "puzzle_not_found" ? (
          <ProductPanel className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Puzzle not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">The puzzle may have been removed or the link is invalid.</p>
                <Button asChild className="mt-4 rounded-xl">
                  <Link href="/puzzles">Back to puzzles</Link>
                </Button>
              </div>
            </div>
          </ProductPanel>
        ) : errorMessage ? (
          <ProductPanel className="p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-red-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Unable to open puzzle</h2>
                <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                <Button asChild className="mt-4 rounded-xl">
                  <Link href="/puzzles">Back to puzzles</Link>
                </Button>
              </div>
            </div>
          </ProductPanel>
        ) : puzzle ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <ProductPanel className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-white">{puzzle.title}</h2>
                <DataPill>{puzzle.difficulty}</DataPill>
                <DataPill tone="accent">{puzzle.primaryTheme}</DataPill>
                {isLocked ? (
                  <DataPill tone="warning">
                    <Lock className="h-3.5 w-3.5" />
                    Locked
                  </DataPill>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{puzzle.description}</p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2 sm:p-3">
                <Chessboard
                  id={`puzzle-${puzzle.id}`}
                  position={boardFen}
                  boardOrientation={"white"}
                  arePiecesDraggable={!isLocked && !isSubmitting}
                  onPieceDrop={onPieceDrop}
                  customDarkSquareStyle={{ backgroundColor: "#48617d" }}
                  customLightSquareStyle={{ backgroundColor: "#e6edf6" }}
                  customBoardStyle={{ borderRadius: "12px" }}
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={uciInput}
                  onChange={(event) => setUciInput(event.target.value.toLowerCase())}
                  placeholder="Enter UCI move, e.g. d5d8"
                  className="control-base h-11 rounded-xl text-white placeholder:text-slate-500"
                  disabled={isLocked || isSubmitting}
                />
                <Button
                  className="h-11 rounded-xl"
                  onClick={() => void sendAttempt(uciInput)}
                  disabled={isLocked || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Submitting
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4" />
                      Submit move
                    </>
                  )}
                </Button>
              </div>

              {attemptMessage ? (
                <InsetPanel className="mt-3 border border-emerald-400/20 p-3 text-sm text-emerald-200">
                  {attemptMessage}
                </InsetPanel>
              ) : null}

              {attemptError ? (
                <InsetPanel className="mt-3 border border-red-400/20 p-3 text-sm text-red-200">{attemptError}</InsetPanel>
              ) : null}

              {isLocked ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="control-base rounded-xl text-white hover:bg-white/10">
                    <Link href="/puzzles">
                      <RefreshCw className="h-4 w-4" />
                      Try another puzzle
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="control-base rounded-xl text-white hover:bg-white/10">
                    <Link href="/puzzles/progress">View progress</Link>
                  </Button>
                </div>
              ) : null}
            </ProductPanel>

            <ProductPanel className="p-5">
              <p className="section-eyebrow">Attempt status</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Current run</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DataPill tone={statusTone(lastAttempt?.status)}>{statusText}</DataPill>
                <DataPill>Hints used {hintsUsed}</DataPill>
              </div>

              {!isAuthenticated ? (
                <InsetPanel className="mt-4 p-4">
                  <p className="text-sm text-slate-300">Puzzle browsing is public, but submitting attempts requires login.</p>
                  <Button onClick={() => openAuthModal("login")} className="mt-3 rounded-xl">
                    Sign in
                  </Button>
                </InsetPanel>
              ) : null}

              <div className="mt-4 grid gap-3">
                <MetricCard label="Solved steps" value={`${solvedSteps}/${totalSteps}`} />
                <MetricCard label="Attempts used" value={attemptsUsed} />
                <MetricCard label="Remaining attempts" value={remainingAttempts} />
                <MetricCard label="Awarded score" value={lastAttempt?.awardedScore ?? 0} />
                <MetricCard label="Current streak" value={lastAttempt?.currentStreak ?? 0} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {lastAttempt?.status === "completed" ? (
                  <DataPill tone="success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed
                  </DataPill>
                ) : null}
                {lastAttempt?.status === "failed" ? (
                  <DataPill tone="danger">
                    <XCircle className="h-3.5 w-3.5" />
                    Failed
                  </DataPill>
                ) : null}
                {lastAttempt?.status === "incorrect" ? (
                  <DataPill tone="warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Incorrect
                  </DataPill>
                ) : null}
              </div>
            </ProductPanel>
          </div>
        ) : null}
      </div>
    </AppLayout>
  )
}
