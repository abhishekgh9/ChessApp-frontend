"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
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
import { DataPill, InsetPanel, MetricCard } from "@/components/design-system/product"
import {
  AnalysisPanel as Panel,
  BoardArrow,
  PlayerSummaryCard,
  PostGameErrorState,
  classificationAccent,
  classificationTone,
  formatAccuracy,
  formatEval,
  formatRatingDelta,
  formatResult,
  parseUciMove,
} from "@/features/analysis/components/review-ui"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AnalysisResponse,
  BackendError,
  PostGameAnalysisResponse,
  analysisApi,
  gamesApi,
  getErrorMessage,
} from "@/lib/backend"
import { createMovePayload, toChessMoveInput } from "@/lib/chess-move"
import { cn } from "@/lib/utils"

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
        toast.error("That PGN could not be parsed.")
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
        toast.error("That FEN could not be parsed.")
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
  const postGameSquareStyles = useMemo<Record<string, CSSProperties>>(() => {
    if (!selectedPostGameMove) {
      return {}
    }

    const styles: Record<string, CSSProperties> = {}
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
              description="A move-by-move review of the finished game with accuracy, performance, and key decision points."
            >
              {isLoadingPostGame ? (
                <InsetPanel className="p-5 text-sm text-slate-300">Loading finished-game analysis...</InsetPanel>
              ) : postGameError ? (
                <PostGameErrorState code={postGameErrorCode} message={postGameError} onSignIn={() => openAuthModal("login")} />
              ) : postGameAnalysis ? (
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
                    <div className="surface-hero p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="section-eyebrow">Your performance</p>
                          <p className="mt-2 text-4xl font-semibold text-white">{formatAccuracy(postGameAnalysis.requestedPlayer.accuracy)}</p>
                          <p className="mt-2 text-sm text-slate-200">
                            Overall game accuracy: <span className="font-semibold text-white">{formatAccuracy(postGameAnalysis.overallAccuracy)}</span>
                          </p>
                        </div>
                        <DataPill>{formatResult(postGameAnalysis.result)}</DataPill>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <MetricCard label="Current rating" value={postGameAnalysis.requestedPlayer.currentRating} />
                        <MetricCard label="Performance rating" value={postGameAnalysis.requestedPlayer.provisionalRating} />
                        <MetricCard label="Rating delta" value={formatRatingDelta(postGameAnalysis.requestedPlayer.ratingDelta)} />
                      </div>
                    </div>

                    <InsetPanel className="p-5">
                      <p className="data-label">Summary</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MetricCard label="Overall accuracy" value={formatAccuracy(postGameAnalysis.overallAccuracy)} />
                        <MetricCard label="Moves reviewed" value={postGameAnalysis.requestedPlayer.movesAnalyzed} />
                      </div>
                    </InsetPanel>
                  </div>

                  <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                    Performance rating is an analysis estimate and does not change your saved account rating.
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PlayerSummaryCard title="You" summary={postGameAnalysis.requestedPlayer} highlighted />
                    <PlayerSummaryCard title="White" summary={postGameAnalysis.white} highlighted={postGameAnalysis.requestedPlayer.color === "white"} />
                    <PlayerSummaryCard title="Black" summary={postGameAnalysis.black} highlighted={postGameAnalysis.requestedPlayer.color === "black"} />
                  </div>

                  <InsetPanel className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Move-by-move review</p>
                        <p className="text-sm text-slate-400">
                          Played moves and best moves are shown in UCI notation for accurate comparison.
                        </p>
                      </div>
                      <DataPill>{formatResult(postGameAnalysis.result)}</DataPill>
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
                          <div className="px-4 py-8 text-sm text-slate-400">No reviewed moves are available for this game.</div>
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
                  </InsetPanel>
                </div>
              ) : (
                <InsetPanel className="p-5 text-sm text-slate-300">No finished-game analysis is available yet.</InsetPanel>
              )}
            </Panel>
          )}

          <Panel title="Board workspace" description="Review positions, step through lines, and inspect candidate moves without losing board focus.">
            <div className="space-y-5">
              <InsetPanel className="relative rounded-[1.5rem] p-3 sm:p-4">
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
              </InsetPanel>

              {isPostGameMode ? (
                <InsetPanel className="p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" size="icon" onClick={goToPostGameStart} disabled={selectedPostGameMoveIndex < 0} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={goToPostGamePrev} disabled={selectedPostGameMoveIndex < 0} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={goToPostGameNext} disabled={!postGameAnalysis || selectedPostGameMoveIndex >= postGameAnalysis.moves.length - 1} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={goToPostGameEnd} disabled={!postGameAnalysis || selectedPostGameMoveIndex >= postGameAnalysis.moves.length - 1} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-px bg-white/10" />
                    <Button variant="secondary" onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                      <RotateCcw className="h-4 w-4" />
                      Flip board
                    </Button>
                    <Button variant="secondary" onClick={copyFen} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                      <Copy className="h-4 w-4" />
                      Copy FEN
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Select any reviewed move to jump the board directly to that position.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <DataPill className="px-2.5 py-1">Colored arrow = played move</DataPill>
                    <DataPill className="px-2.5 py-1">White guide = best move</DataPill>
                  </div>
                </InsetPanel>
              ) : (
                <InsetPanel className="flex flex-wrap items-center gap-3 p-3">
                  <Button variant="secondary" size="icon" onClick={goToStart} disabled={moveIndex < 0} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={goToPrev} disabled={moveIndex < 0} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={goToNext} disabled={moveIndex >= history.length - 1} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={goToEnd} disabled={moveIndex >= history.length - 1} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-px bg-white/10" />
                  <Button variant="secondary" onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                    <RotateCcw className="h-4 w-4" />
                    Flip board
                  </Button>
                  <Button variant="secondary" onClick={copyFen} className="control-base rounded-xl text-white hover:bg-white/[0.08]">
                    <Copy className="h-4 w-4" />
                    Copy FEN
                  </Button>
                  <Button variant="secondary" onClick={() => void runFenAnalysis()} className="control-base rounded-xl text-white hover:bg-white/[0.08]" disabled={isAnalyzing}>
                    Analyze FEN
                  </Button>
                </InsetPanel>
              )}
            </div>
          </Panel>
        </div>

        <div className="min-w-0">
          <Panel
            title={isPostGameMode ? "Replay sidebar" : "Analysis tools"}
            description={
              isPostGameMode
                ? "Review the move list and jump the board to any key moment."
                : "Import a game, review the move list, and inspect evaluation patterns."
            }
          >
            <Tabs defaultValue="moves" className="min-h-0 gap-4">
              <TabsList className={cn("grid h-auto w-full rounded-xl border border-white/10 bg-black/20 p-1", isPostGameMode ? "grid-cols-1" : "grid-cols-3")}>
                <TabsTrigger value="moves" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  Moves
                </TabsTrigger>
                {!isPostGameMode && (
                  <TabsTrigger value="import" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Import
                  </TabsTrigger>
                )}
                {!isPostGameMode && (
                  <TabsTrigger value="stats" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
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
                      Run a manual PGN or FEN analysis to see the review summary here.
                    </div>
                  ) : !analysis.valid ? (
                    <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                      This input could not be analyzed. Best move, evaluation, and classifications are unavailable.
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
                    <p className="mt-1 text-xs text-slate-500">UCI notation</p>
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
