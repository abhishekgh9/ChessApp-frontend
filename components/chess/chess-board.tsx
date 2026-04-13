"use client"

import { useCallback, useState } from "react"
import { Square } from "chess.js"
import { Activity, Clock3, Radio, Sparkles } from "lucide-react"
import { Chessboard } from "react-chessboard"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createMovePayload } from "@/lib/chess-move"
import { cn } from "@/lib/utils"

import { useChessSocket } from "@/hooks/useChessSocket"
import { useGame } from "./game-context"
import { useAuth } from "./auth-context"
import { boardThemes, useAppSettings } from "./settings-context"

interface PlayerBannerProps {
  username: string
  rating: number
  avatarUrl?: string
  time: string
  capturedPieces: string[]
  isTop?: boolean
  materialAdvantage?: number
  isActive?: boolean
}

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

function PlayerBanner({
  username,
  rating,
  avatarUrl,
  time,
  capturedPieces,
  isTop = false,
  materialAdvantage = 0,
  isActive = false,
}: PlayerBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[28px] border px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:px-5",
        isActive
          ? "border-primary/35 bg-primary/[0.08]"
          : "border-white/10 bg-white/[0.04]",
        isTop ? "mb-3" : "mt-3",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11 border border-white/10">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-white/10 text-sm font-semibold text-white">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-white">{username}</p>
              {isActive && (
                <Badge className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0 text-[10px] uppercase tracking-[0.2em] text-primary">
                  Turn
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-400">Rating {rating}</p>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-[96px] items-center justify-center rounded-2xl border px-4 py-3 font-mono text-xl font-semibold tabular-nums",
            isActive
              ? "border-primary/30 bg-black/20 text-primary"
              : "border-white/10 bg-black/20 text-white",
          )}
        >
          {time}
        </div>
      </div>

      <div className="flex min-h-6 items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-slate-300">
          {capturedPieces.length === 0 ? (
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">No captures</span>
          ) : (
            capturedPieces.map((piece, index) => (
              <span
                key={`${piece}-${index}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-base"
              >
                {pieceGlyph(piece)}
              </span>
            ))
          )}
        </div>

        {materialAdvantage > 0 && (
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            +{materialAdvantage} material
          </span>
        )}
      </div>
    </div>
  )
}

function EvaluationBar({ evaluation }: { evaluation: number }) {
  const clampedEval = Math.max(-10, Math.min(10, evaluation))
  const whiteAdvantage = 50 + (clampedEval / 10) * 50

  return (
    <div className="relative hidden w-5 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:flex">
      <div className="w-full bg-slate-950 transition-all duration-500" style={{ height: `${100 - whiteAdvantage}%` }} />
      <div className="w-full bg-slate-100 transition-all duration-500" style={{ height: `${whiteAdvantage}%` }} />
      <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
      </span>
    </div>
  )
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

interface ChessBoardProps {
  gameId?: string
}

export function ChessBoard({ gameId }: ChessBoardProps) {
  const {
    game,
    fen,
    backendFen,
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
  const [moveFrom, setMoveFrom] = useState<Square | null>(null)
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})
  const activeTheme = boardThemes[settings.boardTheme]
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

      const newSquares: Record<string, React.CSSProperties> = {}
      moves.forEach((move) => {
        newSquares[move.to] = {
          background: game.get(move.to as Square)
            ? "radial-gradient(circle, rgba(88, 197, 140, 0.18) 82%, transparent 83%)"
            : "radial-gradient(circle, rgba(88, 197, 140, 0.4) 22%, transparent 23%)",
          borderRadius: "50%",
        }
      })
      newSquares[square] = {
        background: "rgba(88, 197, 140, 0.26)",
      }
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
        if (success) {
          if (currentGameId && !currentGame?.isBotGame) {
            sendMove({ gameId: currentGameId, ...movePayload })
          }
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
    [canMoveCurrentTurn, currentGame?.isBotGame, currentGameId, game, isSubmittingMove, moveFrom, optionSquares, getMoveOptions, makeMove, sendMove],
  )

  const onDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      if (!canMoveCurrentTurn || isSubmittingMove) {
        return false
      }

      const movePayload = createMovePayload(game, sourceSquare, targetSquare)
      if (!movePayload) {
        return false
      }

      void makeMove(sourceSquare, targetSquare).then((success) => {
        if (!success) {
          return
        }

        if (currentGameId && !currentGame?.isBotGame) {
          sendMove({ gameId: currentGameId, ...movePayload })
        }
        setMoveFrom(null)
        setOptionSquares({})
      })

      return true
    },
    [canMoveCurrentTurn, currentGame?.isBotGame, currentGameId, isSubmittingMove, makeMove, sendMove],
  )

  const customSquareStyles: Record<string, React.CSSProperties> = {
    ...optionSquares,
    ...(lastMove && {
      [lastMove.from]: { backgroundColor: "rgba(255, 214, 102, 0.35)" },
      [lastMove.to]: { backgroundColor: "rgba(255, 214, 102, 0.35)" },
    }),
  }

  const { whiteCaptured, blackCaptured } = getCapturedPieces(game)
  const materialAdv = getMaterialAdvantage(game)
  const gameStatus = result
    ? result.summary
    : isWhiteTurn
      ? "White to move"
      : "Black to move"
  const topPlayerName =
    boardOrientation === "white"
      ? currentGame?.isBotGame
        ? `Bot Level ${currentGame.botLevel ?? 1}`
        : currentGame?.blackPlayerId === user?.id
          ? user?.username ?? "Black"
          : currentGame
            ? "Opponent"
            : "Awaiting match"
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
            : "Awaiting match"
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
  const topMaterialAdvantage = boardOrientation === "white" ? (materialAdv.black > 0 ? materialAdv.black : 0) : materialAdv.white > 0 ? materialAdv.white : 0
  const bottomMaterialAdvantage = boardOrientation === "white" ? (materialAdv.white > 0 ? materialAdv.white : 0) : materialAdv.black > 0 ? materialAdv.black : 0
  const topIsActive = boardOrientation === "white" ? !isWhiteTurn : isWhiteTurn
  const bottomIsActive = boardOrientation === "white" ? isWhiteTurn : !isWhiteTurn

  return (
    <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 xl:flex-row">
      <div className="order-2 grid gap-3 sm:grid-cols-3 xl:order-1 xl:w-[280px] xl:grid-cols-1">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Radio className={cn("h-4 w-4", isConnected ? "text-emerald-400" : "text-amber-300")} />
            {isConnected ? "Connected to match" : currentGameId ? "Connecting to match" : "Offline board"}
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">{gameStatus}</p>
          <p className="mt-2 text-sm text-slate-400">
            {currentGame
              ? "Live backend state is active. Moves, clocks, chat, and results now persist through the API."
              : "You can explore locally, start a bot game, or create/find a backend game from the right panel."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-slate-300">
              {timeControl}
            </span>
            {botConfig && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                Bot level {botConfig.level}
              </span>
            )}
            {backendFen && (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-slate-400">
                Backend FEN placeholder active
              </span>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Clock3 className="h-4 w-4 text-primary" />
            Match rhythm
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">White</p>
              <p className="mt-1 text-xl font-semibold text-white">{formatTime(whiteTime)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Black</p>
              <p className="mt-1 text-xl font-semibold text-white">{formatTime(blackTime)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Activity className="h-4 w-4 text-primary" />
            Evaluation
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Analysis still uses placeholder backend signals, so this panel is best treated as a lightweight guide.
          </p>
        </div>
      </div>

      <div className="order-1 flex min-w-0 flex-1 items-stretch gap-3 xl:order-2">
        <EvaluationBar evaluation={evaluation} />

        <div className="flex min-w-0 flex-1 flex-col">
          <PlayerBanner
            username={topPlayerName}
            rating={topPlayerRating}
            time={formatTime(topTime)}
            capturedPieces={topCapturedPieces}
            materialAdvantage={topMaterialAdvantage}
            isTop
            isActive={topIsActive}
          />

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Board view</p>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  Highlighted legal moves, latest move tracking, and stable board proportions.
                </p>
              </div>
              <Badge className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Refined match layout
              </Badge>
            </div>

            <div className="relative aspect-square w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#11181b] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Chessboard
                position={fen}
                onSquareClick={onSquareClick}
                onPieceDrop={onDrop}
                boardOrientation={boardOrientation}
                arePiecesDraggable={canMoveCurrentTurn && !isSubmittingMove}
                customSquareStyles={customSquareStyles}
                customBoardStyle={{
                  borderRadius: "22px",
                  overflow: "hidden",
                }}
                customDarkSquareStyle={{ backgroundColor: activeTheme.dark }}
                customLightSquareStyle={{ backgroundColor: activeTheme.light }}
                areArrowsAllowed={true}
                showBoardNotation={true}
              />

              {result && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in">
                  <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#101719]/95 p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] animate-fade-in-scale">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                      Match complete
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {result.summary}
                    </h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">{result.reason}</p>
                  </div>
                </div>
              )}

              {(isLoadingGame || isSubmittingMove) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white backdrop-blur-[1px]">
                  {isLoadingGame ? "Loading game..." : "Submitting move..."}
                </div>
              )}
            </div>
          </div>

          <PlayerBanner
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
