"use client"

import { useCallback, useState } from "react"
import type { CSSProperties } from "react"
import { Square } from "chess.js"
import { Clock3, Radio } from "lucide-react"
import { Chessboard } from "react-chessboard"

import {
  DataPill,
  InsetPanel,
  MetricCard,
  PanelHeader,
  ProductPanel,
} from "@/components/design-system/product"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createMovePayload } from "@/lib/chess-move"
import { cn } from "@/lib/utils"

import { useChessSocket } from "@/hooks/useChessSocket"
import { useAuth } from "@/components/chess/auth-context"
import { useGame } from "@/components/chess/game-context"
import { boardThemes, useAppSettings } from "@/components/chess/settings-context"

function pieceGlyph(piece: string) {
  const glyphs: Record<string, string> = {
    wp: "\u2659",
    wn: "\u2658",
    wb: "\u2657",
    wr: "\u2656",
    wq: "\u2655",
    bp: "\u265F",
    bn: "\u265E",
    bb: "\u265D",
    br: "\u265C",
    bq: "\u265B",
  }

  return glyphs[piece] ?? piece
}

function getCapturedPieces(game: ReturnType<typeof useGame>["game"]) {
  const history = game.history({ verbose: true })
  const whiteCaptured: string[] = []
  const blackCaptured: string[] = []

  for (const move of history) {
    if (!move.captured) continue
    if (move.color === "w") {
      blackCaptured.push(`b${move.captured}`)
    } else {
      whiteCaptured.push(`w${move.captured}`)
    }
  }

  return { whiteCaptured, blackCaptured }
}

function getMaterialAdvantage(game: ReturnType<typeof useGame>["game"]) {
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }
  const { whiteCaptured, blackCaptured } = getCapturedPieces(game)
  const whiteScore = blackCaptured.reduce((total, piece) => total + (pieceValues[piece[1]] ?? 0), 0)
  const blackScore = whiteCaptured.reduce((total, piece) => total + (pieceValues[piece[1]] ?? 0), 0)

  return { white: whiteScore - blackScore, black: blackScore - whiteScore }
}

function PlayerRail({
  username,
  rating,
  avatarUrl,
  time,
  capturedPieces,
  isActive,
  materialAdvantage,
}: {
  username: string
  rating: number
  avatarUrl?: string
  time: string
  capturedPieces: string[]
  isActive: boolean
  materialAdvantage: number
}) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-2xl border px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        isActive ? "border-primary/25 bg-primary/[0.08]" : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-11 w-11 border border-white/10">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-white/[0.06] text-sm font-semibold text-white">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-white">{username}</p>
            {isActive ? <DataPill tone="accent">Move</DataPill> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Rating {rating}</span>
            {materialAdvantage > 0 ? <span className="text-primary">+{materialAdvantage} material</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex flex-wrap gap-1.5">
          {capturedPieces.length === 0 ? (
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">No captures</span>
          ) : (
            capturedPieces.map((piece, index) => (
              <span
                key={`${piece}-${index}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm"
              >
                {pieceGlyph(piece)}
              </span>
            ))
          )}
        </div>

        <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center font-mono text-xl font-semibold text-white">
          {time}
        </div>
      </div>
    </div>
  )
}

function EvaluationBar({ evaluation }: { evaluation: number }) {
  const clampedEval = Math.max(-10, Math.min(10, evaluation))
  const whiteAdvantage = 50 + (clampedEval / 10) * 50

  return (
    <div className="relative hidden w-4 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/30 sm:flex">
      <div className="w-full bg-slate-950 transition-all duration-500" style={{ height: `${100 - whiteAdvantage}%` }} />
      <div className="w-full bg-slate-100 transition-all duration-500" style={{ height: `${whiteAdvantage}%` }} />
      <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
      </span>
    </div>
  )
}

export function PlayBoard({ gameId }: { gameId?: string }) {
  const {
    game,
    fen,
    evaluation,
    whiteTime,
    blackTime,
    lastMove,
    makeMove,
    isWhiteTurn,
    boardOrientation,
    result,
    timeControl,
    botConfig,
    currentGame,
    currentGameId,
    applyGameUpdate,
    appendChatMessage,
    isLoadingGame,
    isSubmittingMove,
  } = useGame()
  const { token, user } = useAuth()
  const { settings } = useAppSettings()
  const activeTheme = boardThemes[settings.boardTheme]
  const [moveFrom, setMoveFrom] = useState<Square | null>(null)
  const [optionSquares, setOptionSquares] = useState<Record<string, CSSProperties>>({})

  const playerColor =
    currentGame?.whitePlayerId === user?.id
      ? "white"
      : currentGame?.blackPlayerId === user?.id
        ? "black"
        : currentGame?.isBotGame
          ? botConfig?.color === "random"
            ? null
            : botConfig?.color ?? null
          : null
  const canMoveCurrentTurn = !currentGame || playerColor === (isWhiteTurn ? "white" : "black")

  const { sendMove, isConnected } = useChessSocket({
    gameId: currentGameId ?? gameId ?? null,
    jwtToken: token,
    onGameUpdate: applyGameUpdate,
    onChatMessage: appendChatMessage,
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMoveOptions = useCallback(
    async (square: Square) => {
      const moves = game.moves({ square, verbose: true })
      if (moves.length === 0) return false

      const newSquares: Record<string, CSSProperties> = {}
      moves.forEach((move) => {
        newSquares[move.to] = {
          background: game.get(move.to as Square)
            ? "radial-gradient(circle, rgba(93, 164, 220, 0.18) 82%, transparent 83%)"
            : "radial-gradient(circle, rgba(93, 164, 220, 0.42) 22%, transparent 23%)",
          borderRadius: "50%",
        }
      })
      newSquares[square] = { background: "rgba(93, 164, 220, 0.24)" }
      setOptionSquares(newSquares)
      return true
    },
    [game],
  )

  const onSquareClick = useCallback(
    async (square: Square) => {
      if (!canMoveCurrentTurn || isSubmittingMove) {
        setMoveFrom(null)
        setOptionSquares({})
        return
      }

      if (moveFrom && optionSquares[square]) {
        const movePayload = createMovePayload(game, moveFrom, square)
        if (!movePayload) {
          setMoveFrom(null)
          setOptionSquares({})
          return
        }

        const success = await makeMove(moveFrom, square)
        if (success && currentGameId && !currentGame?.isBotGame) {
          sendMove({ gameId: currentGameId, ...movePayload })
        }
        setMoveFrom(null)
        setOptionSquares({})
        return
      }

      const piece = game.get(square)
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square)
        getMoveOptions(square)
      } else {
        setMoveFrom(null)
        setOptionSquares({})
      }
    },
    [canMoveCurrentTurn, currentGame?.isBotGame, currentGameId, game, getMoveOptions, isSubmittingMove, makeMove, moveFrom, optionSquares, sendMove],
  )

  const onDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      if (!canMoveCurrentTurn || isSubmittingMove) return false

      const movePayload = createMovePayload(game, sourceSquare, targetSquare)
      if (!movePayload) return false

      void makeMove(sourceSquare, targetSquare).then((success) => {
        if (!success) return
        if (currentGameId && !currentGame?.isBotGame) {
          sendMove({ gameId: currentGameId, ...movePayload })
        }
        setMoveFrom(null)
        setOptionSquares({})
      })

      return true
    },
    [canMoveCurrentTurn, currentGame?.isBotGame, currentGameId, game, isSubmittingMove, makeMove, sendMove],
  )

  const customSquareStyles: Record<string, CSSProperties> = {
    ...optionSquares,
    ...(lastMove
      ? {
          [lastMove.from]: { backgroundColor: "rgba(252, 198, 92, 0.32)" },
          [lastMove.to]: { backgroundColor: "rgba(252, 198, 92, 0.32)" },
        }
      : {}),
  }

  const { whiteCaptured, blackCaptured } = getCapturedPieces(game)
  const materialAdv = getMaterialAdvantage(game)
  const topPlayerName =
    boardOrientation === "white"
      ? currentGame?.isBotGame
        ? `Bot Level ${currentGame.botLevel ?? 1}`
        : currentGame?.blackPlayerId === user?.id
          ? user?.username ?? "Black"
          : currentGame
            ? "Opponent"
            : "Awaiting opponent"
      : currentGame?.whitePlayerId === user?.id || !currentGame
        ? user?.username ?? "You"
        : "Opponent"
  const bottomPlayerName =
    boardOrientation === "white"
      ? currentGame?.whitePlayerId === user?.id || !currentGame
        ? user?.username ?? "You"
        : "Opponent"
      : currentGame?.isBotGame
        ? `Bot Level ${currentGame.botLevel ?? 1}`
        : currentGame?.blackPlayerId === user?.id
          ? user?.username ?? "Black"
          : currentGame
            ? "Opponent"
            : "Awaiting opponent"
  const topPlayerRating =
    boardOrientation === "white"
      ? currentGame?.isBotGame
        ? 1200 + (currentGame.botLevel ?? 1) * 150
        : currentGame
          ? 1500
          : 0
      : user?.rating ?? (currentGame?.isBotGame ? 1500 : 0)
  const bottomPlayerRating =
    boardOrientation === "white"
      ? user?.rating ?? (currentGame?.isBotGame ? 1500 : 0)
      : currentGame?.isBotGame
        ? 1200 + (currentGame.botLevel ?? 1) * 150
        : currentGame
          ? 1500
          : 0

  const topTime = boardOrientation === "white" ? blackTime : whiteTime
  const bottomTime = boardOrientation === "white" ? whiteTime : blackTime
  const topCapturedPieces = boardOrientation === "white" ? whiteCaptured : blackCaptured
  const bottomCapturedPieces = boardOrientation === "white" ? blackCaptured : whiteCaptured
  const topMaterialAdvantage = boardOrientation === "white" ? Math.max(materialAdv.black, 0) : Math.max(materialAdv.white, 0)
  const bottomMaterialAdvantage = boardOrientation === "white" ? Math.max(materialAdv.white, 0) : Math.max(materialAdv.black, 0)
  const topIsActive = boardOrientation === "white" ? !isWhiteTurn : isWhiteTurn
  const bottomIsActive = boardOrientation === "white" ? isWhiteTurn : !isWhiteTurn
  const gameStatus = result ? result.summary : isWhiteTurn ? "White to move" : "Black to move"

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 xl:flex-row">
      <div className="order-2 grid gap-3 lg:grid-cols-3 xl:order-1 xl:w-[320px] xl:grid-cols-1">
        <ProductPanel className="p-5">
          <PanelHeader title="Match status" description="Live board state, time control, and current momentum." />
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Radio className={cn("h-4 w-4", isConnected ? "text-emerald-400" : "text-amber-300")} />
              {isConnected ? "Connected" : currentGameId ? "Connecting" : "Board only"}
            </div>
            <div>
              <p className="text-3xl font-semibold text-white">{gameStatus}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentGame
                  ? "Moves, chat, and clocks are active for this match."
                  : "Start a live game, challenge the bot, or review a line from the current position."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DataPill>{timeControl}</DataPill>
              {botConfig ? <DataPill tone="accent">Bot level {botConfig.level}</DataPill> : null}
            </div>
          </div>
        </ProductPanel>

        <ProductPanel className="p-5">
          <PanelHeader title="Clocks" description="Current pace for both sides." />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard label="White" value={formatTime(whiteTime)} meta={<Clock3 className="h-4 w-4 text-primary" />} />
            <MetricCard label="Black" value={formatTime(blackTime)} meta={<Clock3 className="h-4 w-4 text-primary" />} />
          </div>
        </ProductPanel>

        <ProductPanel className="p-5">
          <PanelHeader title="Evaluation" description="A quick read on the current position." />
          <div className="mt-5">
            <MetricCard
              label="Current edge"
              value={evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
              meta={<span>{evaluation > 0 ? "White is pressing" : evaluation < 0 ? "Black is pressing" : "Position is balanced"}</span>}
            />
          </div>
        </ProductPanel>
      </div>

      <div className="order-1 flex min-w-0 flex-1 gap-3 xl:order-2">
        <EvaluationBar evaluation={evaluation} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <PlayerRail
            username={topPlayerName}
            rating={topPlayerRating}
            time={formatTime(topTime)}
            capturedPieces={topCapturedPieces}
            materialAdvantage={topMaterialAdvantage}
            isActive={topIsActive}
          />

          <ProductPanel strong className="p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-2 pb-3">
              <div>
                <p className="data-label">Board</p>
                <p className="mt-1 text-base font-semibold text-white">Primary play surface</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DataPill>{boardOrientation === "white" ? "White perspective" : "Black perspective"}</DataPill>
                <DataPill tone="accent">{lastMove ? "Move highlighted" : "Awaiting move"}</DataPill>
              </div>
            </div>

            <InsetPanel className="relative aspect-square overflow-hidden rounded-[1.4rem] bg-[#10161f] p-2">
              <Chessboard
                position={fen}
                onSquareClick={onSquareClick}
                onPieceDrop={onDrop}
                boardOrientation={boardOrientation}
                arePiecesDraggable={canMoveCurrentTurn && !isSubmittingMove}
                customSquareStyles={customSquareStyles}
                customBoardStyle={{ borderRadius: "18px", overflow: "hidden" }}
                customDarkSquareStyle={{ backgroundColor: activeTheme.dark }}
                customLightSquareStyle={{ backgroundColor: activeTheme.light }}
                areArrowsAllowed
                showBoardNotation
              />

              {result ? (
                <div className="animate-fade-in absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                  <div className="animate-fade-in-scale surface-panel-strong w-full max-w-sm p-6 text-center">
                    <p className="section-eyebrow">Result</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{result.summary}</h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">{result.reason}</p>
                  </div>
                </div>
              ) : null}

              {isLoadingGame || isSubmittingMove ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                  {isLoadingGame ? "Loading game..." : "Submitting move..."}
                </div>
              ) : null}
            </InsetPanel>
          </ProductPanel>

          <PlayerRail
            username={bottomPlayerName}
            rating={bottomPlayerRating}
            time={formatTime(bottomTime)}
            capturedPieces={bottomCapturedPieces}
            materialAdvantage={bottomMaterialAdvantage}
            isActive={bottomIsActive}
          />
        </div>
      </div>
    </section>
  )
}
