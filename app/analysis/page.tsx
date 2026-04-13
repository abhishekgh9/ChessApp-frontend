"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Chess, Square } from "chess.js"
import { Chessboard } from "react-chessboard"
import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  TrendingUp,
  Upload,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/chess/auth-context"
import { AppLayout } from "@/components/chess/app-layout"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AnalysisResponse,
  BackendError,
  PostGameAnalysisPlayerSummary,
  PostGameAnalysisResponse,
  analysisApi,
  gamesApi,
  getErrorMessage,
} from "@/lib/backend"
import { createMovePayload, toChessMoveInput } from "@/lib/chess-move"
import { cn } from "@/lib/utils"

type BoardArrow = [Square, Square, string?]

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.24)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  )
}

function formatEval(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`
}

function formatAccuracy(value: number) {
  return `${value.toFixed(2)}%`
}

function formatRatingDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`
}

function formatResult(result: PostGameAnalysisResponse["result"]) {
  if (result === "WHITE_WIN") return "White won"
  if (result === "BLACK_WIN") return "Black won"
  return "Draw"
}

function classificationTone(classification: string) {
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

function classificationAccent(classification: string) {
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

function parseUciMove(uciMove: string) {
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

function PlayerSummaryCard({
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
        "rounded-[24px] border bg-black/20 p-4",
        highlighted ? "border-primary/30 bg-primary/10" : "border-white/10",
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-slate-500">Accuracy</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatAccuracy(summary.accuracy)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-slate-500">Current rating</p>
          <p className="mt-1 text-lg font-semibold text-white">{summary.currentRating}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-slate-500">Provisional rating</p>
          <p className="mt-1 text-lg font-semibold text-white">{summary.provisionalRating}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-slate-500">Rating delta</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatRatingDelta(summary.ratingDelta)}</p>
        </div>
      </div>
    </div>
  )
}

function PostGameErrorState({
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
        "rounded-[24px] border p-5",
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
      {requiresAuth && (
        <Button onClick={onSignIn} className="mt-4 rounded-2xl">
          Sign in
        </Button>
      )}
    </div>
  )
}

function AnalysisPageContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get("game")
  const { token, isBootstrapping, openAuthModal } = useAuth()

  const [game] = useState(new Chess())
  const [fen, setFen] = useState(game.fen())
  const [pgnInput, setPgnInput] = useState("")
  const [moveIndex, setMoveIndex] = useState(-1)
  const [history, setHistory] = useState<string[]>([])
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white")
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [postGameAnalysis, setPostGameAnalysis] = useState<PostGameAnalysisResponse | null>(null)
  const [postGameError, setPostGameError] = useState<string | null>(null)
  const [postGameErrorCode, setPostGameErrorCode] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingPostGame, setIsLoadingPostGame] = useState(false)
  const [postGameReplayFens, setPostGameReplayFens] = useState<string[]>([new Chess().fen()])
  const [selectedPostGameMoveIndex, setSelectedPostGameMoveIndex] = useState(-1)

  const runPgnAnalysis = useCallback(async (pgn: string) => {
    if (!pgn.trim()) {
      toast.error("Paste or create a PGN first.")
      return null
    }

    setIsAnalyzing(true)
    try {
      const response = await analysisApi.fromPgn(pgn)
      setAnalysis(response)
      if (!response.valid) {
        toast.error("The backend could not parse that PGN.")
      } else {
        toast.success("PGN analysis loaded.")
      }
      return response
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to analyze PGN."))
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const runFenAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const response = await analysisApi.fromFen(fen)
      setAnalysis(response)
      if (!response.valid) {
        toast.error("The backend could not parse that FEN.")
      } else {
        toast.success("FEN analysis loaded.")
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to analyze FEN."))
    } finally {
      setIsAnalyzing(false)
    }
  }, [fen])

  const loadPgn = useCallback(async () => {
    const response = await runPgnAnalysis(pgnInput)
    if (!response?.valid) {
      setHistory([])
      setMoveIndex(-1)
      setFen(new Chess().fen())
      return
    }

    try {
      const newGame = new Chess()
      newGame.loadPgn(pgnInput)
      setHistory(newGame.history())
      setMoveIndex(newGame.history().length - 1)
      setFen(newGame.fen())
    } catch {
      toast.error("The PGN analyzed successfully, but the board view could not be reconstructed locally.")
    }
  }, [pgnInput, runPgnAnalysis])

  const loadPostGameAnalysis = useCallback(async () => {
    if (!gameId) {
      setPostGameAnalysis(null)
      setPostGameError(null)
      setPostGameErrorCode(null)
      return
    }

    if (!token) {
      return
    }

    setIsLoadingPostGame(true)
    setPostGameAnalysis(null)
    setPostGameError(null)
    setPostGameErrorCode(null)
    try {
      const response = await gamesApi.analysis(token, gameId)
      setPostGameAnalysis(response)
      setPostGameError(null)
      setPostGameErrorCode(null)
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load post-game analysis.")
      setPostGameAnalysis(null)
      setPostGameError(message)
      setPostGameErrorCode(error instanceof BackendError ? error.code : null)
      toast.error(message)
    } finally {
      setIsLoadingPostGame(false)
    }
  }, [gameId, token])

  useEffect(() => {
    if (!gameId) {
      setPostGameAnalysis(null)
      setPostGameError(null)
      setPostGameErrorCode(null)
      return
    }

    if (isBootstrapping) {
      return
    }

    if (!token) {
      setPostGameAnalysis(null)
      setPostGameError("Log in to view finished-game analysis.")
      setPostGameErrorCode("unauthorized")
      openAuthModal("login")
      return
    }

    void loadPostGameAnalysis()
  }, [gameId, isBootstrapping, loadPostGameAnalysis, openAuthModal, token])

  useEffect(() => {
    if (!postGameAnalysis) {
      setPostGameReplayFens([new Chess().fen()])
      setSelectedPostGameMoveIndex(-1)
      return
    }

    const replayGame = new Chess()
    const nextFens = [replayGame.fen()]

    for (const move of postGameAnalysis.moves) {
      const parsedMove = parseUciMove(move.uciMove)
      if (!parsedMove) {
        setPostGameError("This game contains illegal moves, so analysis could not be replayed on the board.")
        setPostGameErrorCode("game_contains_illegal_moves")
        setPostGameReplayFens([new Chess().fen()])
        setSelectedPostGameMoveIndex(-1)
        return
      }

      const appliedMove = replayGame.move(parsedMove)
      if (!appliedMove) {
        setPostGameError("This game contains illegal moves, so analysis could not be replayed on the board.")
        setPostGameErrorCode("game_contains_illegal_moves")
        setPostGameReplayFens([new Chess().fen()])
        setSelectedPostGameMoveIndex(-1)
        return
      }

      nextFens.push(replayGame.fen())
    }

    setPostGameReplayFens(nextFens)
    setSelectedPostGameMoveIndex(postGameAnalysis.moves.length > 0 ? postGameAnalysis.moves.length - 1 : -1)
    setBoardOrientation(postGameAnalysis.requestedPlayer.color)
  }, [postGameAnalysis])

  const goToMove = useCallback(
    (index: number) => {
      const newGame = new Chess()
      const moves = history.slice(0, index + 1)
      moves.forEach((move) => newGame.move(move))
      setMoveIndex(index)
      setFen(newGame.fen())
    },
    [history],
  )

  const goToStart = () => {
    setMoveIndex(-1)
    setFen(new Chess().fen())
  }

  const goToPrev = () => {
    if (moveIndex >= 0) {
      goToMove(moveIndex - 1)
    }
  }

  const goToNext = () => {
    if (moveIndex < history.length - 1) {
      goToMove(moveIndex + 1)
    }
  }

  const goToEnd = () => {
    if (history.length > 0) {
      goToMove(history.length - 1)
    }
  }

  const goToPostGameMove = useCallback(
    (index: number) => {
      if (!postGameAnalysis) {
        return
      }
      if (index < -1 || index >= postGameAnalysis.moves.length) {
        return
      }
      setSelectedPostGameMoveIndex(index)
    },
    [postGameAnalysis],
  )

  const goToPostGameStart = () => {
    goToPostGameMove(-1)
  }

  const goToPostGamePrev = () => {
    if (selectedPostGameMoveIndex >= 0) {
      goToPostGameMove(selectedPostGameMoveIndex - 1)
    }
  }

  const goToPostGameNext = () => {
    if (postGameAnalysis && selectedPostGameMoveIndex < postGameAnalysis.moves.length - 1) {
      goToPostGameMove(selectedPostGameMoveIndex + 1)
    }
  }

  const goToPostGameEnd = () => {
    if (postGameAnalysis && postGameAnalysis.moves.length > 0) {
      goToPostGameMove(postGameAnalysis.moves.length - 1)
    }
  }

  const resetBoard = () => {
    setFen(new Chess().fen())
    setHistory([])
    setMoveIndex(-1)
    setPgnInput("")
    setAnalysis(null)
  }

  const copyFen = async () => {
    const fenToCopy = gameId ? postGameReplayFens[Math.max(0, selectedPostGameMoveIndex + 1)] ?? new Chess().fen() : fen
    await navigator.clipboard.writeText(fenToCopy)
    toast.success("FEN copied.")
  }

  const isPostGameMode = Boolean(gameId)
  const displayedFen = isPostGameMode
    ? postGameReplayFens[Math.max(0, selectedPostGameMoveIndex + 1)] ?? new Chess().fen()
    : fen
  const selectedPostGameMove =
    isPostGameMode && postGameAnalysis && selectedPostGameMoveIndex >= 0
      ? postGameAnalysis.moves[selectedPostGameMoveIndex]
      : null
  const selectedMoveAccent = selectedPostGameMove ? classificationAccent(selectedPostGameMove.classification) : null
  const postGameBoardArrows = useMemo<BoardArrow[]>(() => {
    if (!selectedPostGameMove) {
      return []
    }

    const arrows: BoardArrow[] = []
    const playedMove = parseUciMove(selectedPostGameMove.uciMove)
    if (playedMove) {
      arrows.push([playedMove.from, playedMove.to, selectedMoveAccent?.arrowColor ?? "rgba(255,255,255,0.92)"])
    }

    if (selectedPostGameMove.bestMove && selectedPostGameMove.bestMove !== selectedPostGameMove.uciMove) {
      const bestMove = parseUciMove(selectedPostGameMove.bestMove)
      if (bestMove) {
        arrows.push([bestMove.from, bestMove.to, "rgba(255,255,255,0.75)"])
      }
    }

    return arrows
  }, [selectedMoveAccent?.arrowColor, selectedPostGameMove])
  const postGameSquareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    if (!selectedPostGameMove) {
      return {}
    }

    const styles: Record<string, React.CSSProperties> = {}
    const playedMove = parseUciMove(selectedPostGameMove.uciMove)
    if (playedMove) {
      styles[playedMove.from] = {
        background:
          "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 54%, rgba(255,255,255,0) 72%)",
      }
      styles[playedMove.to] = {
        background: `radial-gradient(circle, ${selectedMoveAccent?.squareColor ?? "rgba(255,255,255,0.28)"} 0%, rgba(255,255,255,0.08) 54%, rgba(255,255,255,0) 72%)`,
        boxShadow: `inset 0 0 0 3px ${selectedMoveAccent?.arrowColor ?? "rgba(255,255,255,0.9)"}`,
      }
    }

    if (selectedPostGameMove.bestMove && selectedPostGameMove.bestMove !== selectedPostGameMove.uciMove) {
      const bestMove = parseUciMove(selectedPostGameMove.bestMove)
      if (bestMove) {
        styles[bestMove.to] = {
          ...(styles[bestMove.to] ?? {}),
          outline: "2px dashed rgba(255,255,255,0.78)",
          outlineOffset: "-6px",
        }
      }
    }

    return styles
  }, [selectedMoveAccent?.arrowColor, selectedMoveAccent?.squareColor, selectedPostGameMove])

  const movePairs = useMemo(() => {
    const pairs: { number: number; white: string; black: string | null }[] = []
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1] || null,
      })
    }
    return pairs
  }, [history])

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const newGame = new Chess()
    const moves = history.slice(0, moveIndex + 1)
    moves.forEach((move) => newGame.move(move))

    try {
      const movePayload = createMovePayload(newGame, sourceSquare, targetSquare)
      if (!movePayload) {
        return false
      }

      const move = newGame.move(toChessMoveInput(movePayload))
      if (move) {
        const newHistory = [...moves, move.san]
        const newPgn = newGame.pgn()
        setHistory(newHistory)
        setMoveIndex(newHistory.length - 1)
        setFen(newGame.fen())
        setPgnInput(newPgn)
        void runPgnAnalysis(newPgn)
        return true
      }
    } catch {
      return false
    }
    return false
  }

  const statCards = [
    {
      label: "Best",
      value: analysis?.moveClassifications.filter((item) => item === "best").length ?? 0,
      icon: Sparkles,
      className: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    },
    {
      label: "Good",
      value: analysis?.moveClassifications.filter((item) => item === "good").length ?? 0,
      icon: TrendingUp,
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    },
    {
      label: "Mistakes",
      value: analysis?.moveClassifications.filter((item) => item === "mistake").length ?? 0,
      icon: XCircle,
      className: "border-orange-400/20 bg-orange-400/10 text-orange-300",
    },
    {
      label: "Blunders",
      value: analysis?.moveClassifications.filter((item) => item === "blunder").length ?? 0,
      icon: AlertOctagon,
      className: "border-red-400/20 bg-red-400/10 text-red-300",
    },
  ]

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-24 xl:grid xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-6">
          {gameId && (
            <Panel
              title="Post-game analysis"
              description="Finished-game analysis is loaded from the backend with authenticated access and uses the backend response fields as the source of truth."
            >
              {isLoadingPostGame ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                  Loading finished-game analysis...
                </div>
              ) : postGameError ? (
                <PostGameErrorState code={postGameErrorCode} message={postGameError} onSignIn={() => openAuthModal("login")} />
              ) : postGameAnalysis ? (
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
                    <div className="rounded-[26px] border border-primary/20 bg-[linear-gradient(135deg,rgba(93,214,150,0.16),rgba(255,255,255,0.04))] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Your Analysis</p>
                          <p className="mt-2 text-4xl font-semibold text-white">{formatAccuracy(postGameAnalysis.requestedPlayer.accuracy)}</p>
                          <p className="mt-2 text-sm text-slate-200">
                            Overall accuracy for this game: <span className="font-semibold text-white">{formatAccuracy(postGameAnalysis.overallAccuracy)}</span>
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-slate-200">
                          {formatResult(postGameAnalysis.result)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs text-slate-500">Current rating</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{postGameAnalysis.requestedPlayer.currentRating}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs text-slate-500">Provisional rating</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{postGameAnalysis.requestedPlayer.provisionalRating}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs text-slate-500">Rating delta</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{formatRatingDelta(postGameAnalysis.requestedPlayer.ratingDelta)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Report card</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs text-slate-500">Overall accuracy</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{formatAccuracy(postGameAnalysis.overallAccuracy)}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs text-slate-500">Moves analyzed</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{postGameAnalysis.requestedPlayer.movesAnalyzed}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                    Provisional rating is analysis-only output from the backend and does not update the saved account rating.
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PlayerSummaryCard title="You" summary={postGameAnalysis.requestedPlayer} highlighted />
                    <PlayerSummaryCard title="White" summary={postGameAnalysis.white} highlighted={postGameAnalysis.requestedPlayer.color === "white"} />
                    <PlayerSummaryCard title="Black" summary={postGameAnalysis.black} highlighted={postGameAnalysis.requestedPlayer.color === "black"} />
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Move-by-move review</p>
                        <p className="text-sm text-slate-400">
                          `bestMove` and `uciMove` are displayed in UCI notation exactly as returned by the backend.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                        {formatResult(postGameAnalysis.result)}
                      </span>
                    </div>

                    <ScrollArea className="h-[420px]">
                      <div className="min-w-[820px] overflow-hidden rounded-2xl border border-white/10">
                        <div className="grid grid-cols-[80px_90px_120px_120px_140px_120px_140px] bg-white/[0.06] px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                          <span>Move</span>
                          <span>Color</span>
                          <span>Played</span>
                          <span>Best</span>
                          <span>Class</span>
                          <span>Accuracy</span>
                          <span>Eval after</span>
                        </div>
                        {postGameAnalysis.moves.length === 0 ? (
                          <div className="px-4 py-8 text-sm text-slate-400">No analyzed moves were returned by the backend.</div>
                        ) : (
                          postGameAnalysis.moves.map((move, index) => (
                            <button
                              key={`${move.moveNumber}-${move.color}-${index}`}
                              type="button"
                              onClick={() => goToPostGameMove(index)}
                              className={cn(
                                "grid w-full grid-cols-[80px_90px_120px_120px_140px_120px_140px] items-center border-t border-white/10 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/[0.04]",
                                selectedPostGameMoveIndex === index && "bg-primary/12 text-white",
                              )}
                            >
                              <span>{move.moveNumber}</span>
                              <span className="capitalize">{move.color}</span>
                              <span className="font-mono text-xs text-slate-300">{move.uciMove}</span>
                              <span className="font-mono text-xs text-slate-300">{move.bestMove ?? "--"}</span>
                              <span>
                                <span className={cn("rounded-full border px-2.5 py-1 text-xs", classificationTone(move.classification))}>
                                  {move.classification}
                                </span>
                              </span>
                              <span>{formatAccuracy(move.accuracy)}</span>
                              <span>{formatEval(move.evaluationAfter)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                  No finished-game analysis loaded yet.
                </div>
              )}
            </Panel>
          )}

          <Panel title="Board workspace" description="Manual analysis now uses the live backend PGN and FEN routes, while keeping the same study workflow.">
            <div className="space-y-5">
              <div className="relative rounded-[26px] border border-white/10 bg-black/20 p-3 sm:p-4">
                {selectedPostGameMove && selectedMoveAccent && (
                  <>
                    <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
                          selectedMoveAccent.badgeClassName,
                        )}
                      >
                        {selectedMoveAccent.label}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs text-slate-200">
                        {selectedPostGameMove.color} played {selectedPostGameMove.uciMove}
                      </span>
                    </div>
                    {selectedPostGameMove.bestMove && selectedPostGameMove.bestMove !== selectedPostGameMove.uciMove && (
                      <div className="pointer-events-none absolute bottom-6 left-6 z-10 rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs text-slate-200 shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
                        Best move: <span className="font-mono text-white">{selectedPostGameMove.bestMove}</span>
                      </div>
                    )}
                  </>
                )}
                <Chessboard
                  position={displayedFen}
                  onPieceDrop={isPostGameMode ? undefined : onDrop}
                  boardOrientation={boardOrientation}
                  areArrowsAllowed={!isPostGameMode}
                  customArrows={isPostGameMode ? postGameBoardArrows : undefined}
                  customSquareStyles={isPostGameMode ? postGameSquareStyles : undefined}
                  customBoardStyle={{
                    borderRadius: "22px",
                    overflow: "hidden",
                  }}
                  customDarkSquareStyle={{ backgroundColor: "#6B4E34" }}
                  customLightSquareStyle={{ backgroundColor: "#E8D9B5" }}
                />
              </div>

              {isPostGameMode ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" size="icon" onClick={goToPostGameStart} disabled={selectedPostGameMoveIndex < 0} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={goToPostGamePrev} disabled={selectedPostGameMoveIndex < 0} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={goToPostGameNext} disabled={!postGameAnalysis || selectedPostGameMoveIndex >= postGameAnalysis.moves.length - 1} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={goToPostGameEnd} disabled={!postGameAnalysis || selectedPostGameMoveIndex >= postGameAnalysis.moves.length - 1} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-px bg-white/10" />
                    <Button variant="secondary" onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <RotateCcw className="h-4 w-4" />
                      Flip board
                    </Button>
                    <Button variant="secondary" onClick={copyFen} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <Copy className="h-4 w-4" />
                      Copy FEN
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Selecting a move in the review table updates the board using the backend UCI move timeline.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">Colored arrow = played move</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">White guide = engine best move</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-white/10 bg-black/20 p-3">
                  <Button variant="secondary" size="icon" onClick={goToStart} disabled={moveIndex < 0} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={goToPrev} disabled={moveIndex < 0} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={goToNext} disabled={moveIndex >= history.length - 1} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={goToEnd} disabled={moveIndex >= history.length - 1} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-px bg-white/10" />
                  <Button variant="secondary" onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                    <RotateCcw className="h-4 w-4" />
                    Flip board
                  </Button>
                  <Button variant="secondary" onClick={copyFen} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                    <Copy className="h-4 w-4" />
                    Copy FEN
                  </Button>
                  <Button variant="secondary" onClick={() => void runFenAnalysis()} className="rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]" disabled={isAnalyzing}>
                    Analyze FEN
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="min-w-0">
          <Panel
            title={isPostGameMode ? "Replay sidebar" : "Analysis tools"}
            description={
              isPostGameMode
                ? "Review the backend move timeline and jump the board to any analyzed move."
                : "Manual PGN and FEN analysis are wired directly to the current backend contract."
            }
          >
            <Tabs defaultValue="moves" className="min-h-0 gap-4">
              <TabsList className={cn("grid h-auto w-full rounded-[20px] border border-white/10 bg-black/20 p-1", isPostGameMode ? "grid-cols-1" : "grid-cols-3")}>
                <TabsTrigger value="moves" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  Moves
                </TabsTrigger>
                {!isPostGameMode && (
                  <TabsTrigger value="import" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Import
                  </TabsTrigger>
                )}
                {!isPostGameMode && (
                  <TabsTrigger value="stats" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Stats
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="moves" className="min-h-0">
                <div className="space-y-4">
                  <ScrollArea className="h-[360px] rounded-[24px] border border-white/10 bg-black/20 p-4">
                    {isPostGameMode ? (
                      !postGameAnalysis || postGameAnalysis.moves.length === 0 ? (
                        <div className="flex h-full min-h-56 items-center justify-center text-center text-slate-400">
                          No analyzed moves are available for replay.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={goToPostGameStart}
                            className={cn(
                              "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                              selectedPostGameMoveIndex === -1
                                ? "border-primary/25 bg-primary/12 text-white"
                                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]",
                            )}
                          >
                            Start position
                          </button>
                          {postGameAnalysis.moves.map((move, index) => (
                            <button
                              key={`${move.moveNumber}-${move.color}-sidebar-${index}`}
                              type="button"
                              onClick={() => goToPostGameMove(index)}
                              className={cn(
                                "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                                selectedPostGameMoveIndex === index
                                  ? "border-primary/25 bg-primary/12 text-white"
                                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">
                                  {move.moveNumber}. {move.color === "white" ? "White" : "Black"}
                                </span>
                                <span className={cn("rounded-full border px-2.5 py-1 text-xs", classificationTone(move.classification))}>
                                  {move.classification}
                                </span>
                              </div>
                              <p className="mt-2 font-mono text-xs text-slate-300">
                                played {move.uciMove} | best {move.bestMove ?? "--"}
                              </p>
                              <p className="mt-2 text-xs text-slate-400">
                                accuracy {formatAccuracy(move.accuracy)} | eval {formatEval(move.evaluationAfter)}
                              </p>
                            </button>
                          ))}
                        </div>
                      )
                    ) : movePairs.length === 0 ? (
                      <div className="flex h-full min-h-56 items-center justify-center text-center text-slate-400">
                        Import a game or start making moves to populate the review list.
                      </div>
                    ) : (
                      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1 text-sm">
                        {movePairs.map((move, idx) => {
                          const whiteIdx = idx * 2
                          const blackIdx = idx * 2 + 1
                          return (
                            <div key={idx} className="contents">
                              <span className="pt-2 pr-2 text-xs font-medium text-slate-500">{move.number}.</span>
                              <button
                                onClick={() => goToMove(whiteIdx)}
                                className={cn(
                                  "rounded-xl px-3 py-2 text-left text-slate-200 transition-colors hover:bg-white/[0.05]",
                                  moveIndex === whiteIdx && "bg-primary/15 text-primary",
                                )}
                              >
                                {move.white}
                              </button>
                              <button
                                onClick={() => move.black && goToMove(blackIdx)}
                                className={cn(
                                  "rounded-xl px-3 py-2 text-left text-slate-200 transition-colors hover:bg-white/[0.05]",
                                  move.black ? (moveIndex === blackIdx ? "bg-primary/15 text-primary" : "") : "invisible",
                                )}
                              >
                                {move.black || "-"}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {!isPostGameMode && (
                    <Button variant="secondary" onClick={resetBoard} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                      <RotateCcw className="h-4 w-4" />
                      Reset board
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="import">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <label className="mb-3 block text-sm font-medium text-slate-200">Paste PGN</label>
                    <Textarea
                      placeholder="1. e4 e5 2. Nf3 Nc6..."
                      className="min-h-[180px] resize-none rounded-2xl border-white/10 bg-white/[0.04] font-mono text-sm text-white placeholder:text-slate-500"
                      value={pgnInput}
                      onChange={(e) => setPgnInput(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => void loadPgn()} className="h-12 flex-1 rounded-2xl" disabled={isAnalyzing}>
                      <Upload className="h-4 w-4" />
                      {isAnalyzing ? "Analyzing..." : "Load PGN"}
                    </Button>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium text-slate-200">Current FEN</p>
                    <p className="mt-3 break-all rounded-2xl border border-white/10 bg-white/[0.04] p-3 font-mono text-xs text-slate-300">
                      {fen}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats">
                <div className="space-y-4">
                  {!analysis ? (
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                      Run a manual PGN or FEN analysis to see backend results here.
                    </div>
                  ) : !analysis.valid ? (
                    <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                      The backend marked this input as invalid. Best move, evaluation, and classifications were intentionally returned empty.
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    {statCards.map((stat) => (
                      <div key={stat.label} className={cn("rounded-[22px] border p-4", stat.className)}>
                        <stat.icon className="h-5 w-5" />
                        <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                        <p className="text-sm">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Best move</p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-white">{analysis?.bestMove ?? "--"}</p>
                    <p className="mt-1 text-xs text-slate-500">UCI from the backend</p>
                    <p className="mt-3 text-sm text-slate-400">Evaluation</p>
                    <p className="mt-1 text-lg font-medium text-white">{analysis ? formatEval(analysis.evaluation) : "--"}</p>
                    <p className="mt-4 text-sm text-slate-400">Classification trail</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(analysis?.moveClassifications ?? []).map((item, idx) => (
                        <span key={`${item}-${idx}`} className={cn("rounded-full border px-3 py-1 text-xs", classificationTone(item))}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Evaluation series</p>
                    <div className="mt-3 h-28 rounded-2xl border border-white/10 bg-[#0f1618] p-3">
                      <svg className="h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                        <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.5" />
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-primary"
                          points={(analysis?.evaluationSeries ?? [0])
                            .map((value, index, array) => {
                              const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100
                              const y = 25 - value * 10
                              return `${x},${y}`
                            })
                            .join(" ")}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Panel>
        </div>
      </div>
    </AppLayout>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={null}>
      <AnalysisPageContent />
    </Suspense>
  )
}
