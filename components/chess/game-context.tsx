"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Chess, Square } from "chess.js"
import { toast } from "sonner"

import {
  GameChatMessageResponse,
  GameMoveSummary,
  GameResponse,
  MatchmakingStatusResponse,
  botGamesApi,
  gamesApi,
  getErrorMessage,
  matchmakingApi,
} from "@/lib/backend"
import { createMovePayload, normalizePromotion, toChessMoveInput } from "@/lib/chess-move"

import { useAuth } from "./auth-context"
import { parseTimeControlToSeconds, useAppSettings } from "./settings-context"

type PlayerColor = "white" | "black" | "random"

interface BotConfig {
  level: number
  label: string
  color: PlayerColor
}

interface PendingClockState {
  whiteTime: number
  blackTime: number
  turnColor: "white" | "black"
  startedAt: number
}

interface GameResult {
  winner: "white" | "black" | "draw" | null
  reason: string
  summary: string
}

interface GameContextType {
  game: Chess
  fen: string
  backendFen: string | null
  history: string[]
  evaluation: number
  whiteTime: number
  blackTime: number
  lastMove: { from: string; to: string } | null
  isWhiteTurn: boolean
  boardOrientation: "white" | "black"
  timeControl: string
  result: GameResult | null
  botConfig: BotConfig | null
  currentGame: GameResponse | null
  currentGameId: string | null
  chatMessages: GameChatMessageResponse[]
  matchmakingStatus: MatchmakingStatusResponse | null
  isLoadingGame: boolean
  isSubmittingMove: boolean
  isSearchingMatch: boolean
  makeMove: (from: Square, to: Square) => Promise<boolean>
  loadFen: (fen: string) => void
  loadPgn: (pgn: string) => boolean
  exportPgn: () => string
  exportFen: () => string
  resetGame: (options?: { orientation?: "white" | "black"; botConfig?: BotConfig | null }) => Promise<void>
  undoMove: () => boolean
  resignGame: () => Promise<void>
  offerDraw: () => Promise<void>
  respondToDraw: (accepted: boolean) => Promise<void>
  setBoardOrientation: (orientation: "white" | "black") => void
  startBotGame: (config: BotConfig) => Promise<boolean>
  loadGameById: (gameId: string) => Promise<void>
  sendChatMessage: (message: string) => Promise<void>
  refreshChat: () => Promise<void>
  applyGameUpdate: (gameResponse: GameResponse) => void
  appendChatMessage: (message: GameChatMessageResponse) => void
  startMatchmaking: () => Promise<void>
  cancelMatchmaking: () => Promise<void>
}

const GameContext = createContext<GameContextType | null>(null)

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

function parseMoveToken(value: string): { from: string; to: string; promotion?: string } | null {
  const normalized = value.trim()
  const dashMatch = normalized.match(/^([a-h][1-8])-([a-h][1-8])([nbrq])?$/i)
  if (dashMatch) {
    return { from: dashMatch[1].toLowerCase(), to: dashMatch[2].toLowerCase(), promotion: dashMatch[3]?.toLowerCase() }
  }

  const compactMatch = normalized.match(/^([a-h][1-8])([a-h][1-8])([nbrq])?$/i)
  if (compactMatch) {
    return { from: compactMatch[1].toLowerCase(), to: compactMatch[2].toLowerCase(), promotion: compactMatch[3]?.toLowerCase() }
  }

  return null
}

function applyVerboseMove(chess: Chess, move: GameMoveSummary) {
  if (move.from && move.to) {
    const promotion = normalizePromotion(move.promotion)
    chess.move(
      promotion
        ? {
            from: move.from as Square,
            to: move.to as Square,
            promotion,
          }
        : {
            from: move.from as Square,
            to: move.to as Square,
          },
    )
    return true
  }

  if (move.san) {
    chess.move(move.san)
    return true
  }

  return false
}

function buildChessFromGame(gameResponse: GameResponse | null) {
  const chess = new Chess()

  if (!gameResponse) {
    return chess
  }

  try {
    chess.load(gameResponse.fen)
    return chess
  } catch {
    // Fall back to rebuilding from move history if the backend sends a transient placeholder FEN.
  }

  for (const move of gameResponse.history) {
    try {
      if (typeof move === "string") {
        const parsed = parseMoveToken(move)
        if (parsed) {
          const promotion = normalizePromotion(parsed.promotion)
          chess.move(
            promotion
              ? {
                  from: parsed.from as Square,
                  to: parsed.to as Square,
                  promotion,
                }
              : {
                  from: parsed.from as Square,
                  to: parsed.to as Square,
                },
          )
        } else {
          chess.move(move)
        }
      } else {
        applyVerboseMove(chess, move)
      }
    } catch {
      // The backend's placeholder move/FEN quality can lag behind strict chess notation.
      break
    }
  }

  if (gameResponse.lastMove) {
    const alreadyApplied = gameResponse.history.length > 0
    if (!alreadyApplied) {
      try {
        applyVerboseMove(chess, gameResponse.lastMove)
      } catch {
        // Ignore malformed placeholder moves.
      }
    }
  }

  return chess
}

function mapHistory(gameResponse: GameResponse | null, fallback: Chess) {
  if (!gameResponse) {
    return fallback.history()
  }

  return gameResponse.history.map((entry) => {
    if (typeof entry === "string") return entry
    if (entry.san) return entry.san
    if (entry.from && entry.to) return `${entry.from}-${entry.to}`
    return "move"
  })
}

function mapResult(gameResponse: GameResponse | null): GameResult | null {
  if (!gameResponse || gameResponse.status !== "FINISHED") return null

  const result = gameResponse.result
  const winner =
    result === "WHITE_WIN" ? "white" : result === "BLACK_WIN" ? "black" : result === "DRAW" ? "draw" : null

  const summary =
    result === "WHITE_WIN"
      ? "White wins."
      : result === "BLACK_WIN"
        ? "Black wins."
        : result === "DRAW"
          ? "Game drawn."
          : "Game finished."

  return {
    winner,
    reason: gameResponse.resultReason?.replaceAll("_", " ").toLowerCase() ?? "completed",
    summary,
  }
}

function averageEval(historyLength: number) {
  if (!historyLength) return 0.2
  return Math.max(-10, Math.min(10, (historyLength % 8) * 0.15 - 0.4))
}

function mapLocalResult(game: Chess): GameResult | null {
  if (game.isCheckmate()) {
    return {
      winner: game.turn() === "w" ? "black" : "white",
      reason: "checkmate",
      summary: `Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`,
    }
  }
  if (game.isStalemate()) {
    return { winner: "draw", reason: "stalemate", summary: "Draw by stalemate." }
  }
  if (game.isInsufficientMaterial() || game.isThreefoldRepetition() || game.isDraw()) {
    return { winner: "draw", reason: "draw", summary: "Drawn game." }
  }
  return null
}

function clampClock(seconds: number) {
  return Math.max(0, seconds)
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppSettings()
  const { token, user, isAuthenticated, openAuthModal } = useAuth()

  const [localGame, setLocalGame] = useState(() => new Chess())
  const [currentGame, setCurrentGame] = useState<GameResponse | null>(null)
  const [chatMessages, setChatMessages] = useState<GameChatMessageResponse[]>([])
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white")
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [isSubmittingMove, setIsSubmittingMove] = useState(false)
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatusResponse | null>(null)
  const [isSearchingMatch, setIsSearchingMatch] = useState(false)
  const [clockNow, setClockNow] = useState(() => Date.now())
  const [pendingClock, setPendingClock] = useState<PendingClockState | null>(null)

  const liveGame = useMemo(() => buildChessFromGame(currentGame), [currentGame])
  const game = currentGame ? liveGame : localGame
  const history = useMemo(() => mapHistory(currentGame, game), [currentGame, game])
  const result = useMemo(() => mapResult(currentGame) ?? mapLocalResult(game), [currentGame, game])
  const lastMove = useMemo(() => {
    if (currentGame?.lastMove?.from && currentGame?.lastMove?.to) {
      return { from: currentGame.lastMove.from, to: currentGame.lastMove.to }
    }

    const verbose = game.history({ verbose: true })
    const latest = verbose[verbose.length - 1]
    return latest ? { from: latest.from, to: latest.to } : null
  }, [currentGame, game])

  const timeControl = currentGame?.timeControl ?? settings.defaultTimeControl
  const baseWhiteTime = currentGame?.whiteTimeRemaining ?? parseTimeControlToSeconds(timeControl)
  const baseBlackTime = currentGame?.blackTimeRemaining ?? parseTimeControlToSeconds(timeControl)
  const whiteTime = useMemo(() => {
    if (pendingClock) {
      const elapsedSeconds = Math.floor((clockNow - pendingClock.startedAt) / 1000)
      return pendingClock.turnColor === "white"
        ? clampClock(pendingClock.whiteTime - Math.max(0, elapsedSeconds))
        : pendingClock.whiteTime
    }

    if (!currentGame || currentGame.status !== "ACTIVE" || currentGame.turnColor !== "white") {
      return baseWhiteTime
    }

    const updatedAtMs = Date.parse(currentGame.updatedAt)
    if (Number.isNaN(updatedAtMs)) {
      return baseWhiteTime
    }

    const elapsedSeconds = Math.floor((clockNow - updatedAtMs) / 1000)
    return clampClock(baseWhiteTime - Math.max(0, elapsedSeconds))
  }, [baseWhiteTime, clockNow, currentGame, pendingClock])
  const blackTime = useMemo(() => {
    if (pendingClock) {
      const elapsedSeconds = Math.floor((clockNow - pendingClock.startedAt) / 1000)
      return pendingClock.turnColor === "black"
        ? clampClock(pendingClock.blackTime - Math.max(0, elapsedSeconds))
        : pendingClock.blackTime
    }

    if (!currentGame || currentGame.status !== "ACTIVE" || currentGame.turnColor !== "black") {
      return baseBlackTime
    }

    const updatedAtMs = Date.parse(currentGame.updatedAt)
    if (Number.isNaN(updatedAtMs)) {
      return baseBlackTime
    }

    const elapsedSeconds = Math.floor((clockNow - updatedAtMs) / 1000)
    return clampClock(baseBlackTime - Math.max(0, elapsedSeconds))
  }, [baseBlackTime, clockNow, currentGame, pendingClock])
  const evaluation = averageEval(history.length)

  useEffect(() => {
    if ((!currentGame || currentGame.status !== "ACTIVE") && !pendingClock) {
      return
    }

    setClockNow(Date.now())
    const interval = window.setInterval(() => {
      setClockNow(Date.now())
    }, 250)

    return () => {
      window.clearInterval(interval)
    }
  }, [currentGame?.gameId, currentGame?.status, currentGame?.turnColor, currentGame?.updatedAt, pendingClock])

  const refreshChat = useCallback(async () => {
    if (!token || !currentGame?.gameId) return
    try {
      const history = await gamesApi.chatHistory(token, currentGame.gameId)
      setChatMessages(history)
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load chat history."))
    }
  }, [token, currentGame?.gameId])

  const applyGameUpdate = useCallback(
    (gameResponse: GameResponse) => {
      setPendingClock(null)
      setCurrentGame(gameResponse)
      setBotConfig((current) => {
        if (!gameResponse.isBotGame) return null

        const inferredColor: PlayerColor =
          user && gameResponse.whitePlayerId === user.id
            ? "white"
            : user && gameResponse.blackPlayerId === user.id
              ? "black"
              : current?.color ?? boardOrientation

        return {
          level: gameResponse.botLevel ?? 1,
          label: `Level ${gameResponse.botLevel ?? 1}`,
          color: inferredColor,
        }
      })

      if (user) {
        if (gameResponse.whitePlayerId === user.id) {
          setBoardOrientation("white")
        } else if (gameResponse.blackPlayerId === user.id) {
          setBoardOrientation("black")
        }
      }
    },
    [boardOrientation, user],
  )

  const appendChatMessage = useCallback((message: GameChatMessageResponse) => {
    setChatMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current
      return [...current, message]
    })
  }, [])

  const ensureAuthenticated = useCallback(() => {
    if (!token || !isAuthenticated) {
      openAuthModal("login")
      toast.info("Log in to use live backend play.")
      return false
    }
    return true
  }, [token, isAuthenticated, openAuthModal])

  const loadGameById = useCallback(
    async (gameId: string) => {
      if (!ensureAuthenticated() || !token) return

      setIsLoadingGame(true)
      try {
        const response = await gamesApi.get(token, gameId)
        applyGameUpdate(response)
        const chat = await gamesApi.chatHistory(token, gameId)
        setChatMessages(chat)
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load game."))
      } finally {
        setIsLoadingGame(false)
      }
    },
    [applyGameUpdate, ensureAuthenticated, token],
  )

  const makeMove = useCallback(
    async (from: Square, to: Square) => {
      const movePayload = createMovePayload(game, from, to)
      if (!movePayload) {
        return false
      }

      if (!currentGame) {
        const localCopy = new Chess(localGame.fen())
        try {
          localCopy.move(toChessMoveInput(movePayload))
          setLocalGame(localCopy)
          return true
        } catch {
          return false
        }
      }

      if (!ensureAuthenticated() || !token) return false

      if (currentGame.isBotGame && currentGame.status === "ACTIVE") {
        setPendingClock({
          whiteTime,
          blackTime,
          turnColor: currentGame.turnColor === "white" ? "black" : "white",
          startedAt: Date.now(),
        })
      }

      setIsSubmittingMove(true)
      try {
        const response = await gamesApi.move(token, currentGame.gameId, movePayload)
        applyGameUpdate(response)
        return true
      } catch (error) {
        setPendingClock(null)
        toast.error(getErrorMessage(error, "Move rejected."))
        return false
      } finally {
        setIsSubmittingMove(false)
      }
    },
    [applyGameUpdate, blackTime, currentGame, ensureAuthenticated, game, localGame, token, whiteTime],
  )

  const loadFen = useCallback((fen: string) => {
    const gameCopy = new Chess()
    try {
      gameCopy.load(fen)
      setLocalGame(gameCopy)
      setCurrentGame(null)
    } catch {
      toast.error("Invalid FEN.")
    }
  }, [])

  const loadPgn = useCallback((pgn: string) => {
    const gameCopy = new Chess()
    try {
      gameCopy.loadPgn(pgn)
      setLocalGame(gameCopy)
      setCurrentGame(null)
      return true
    } catch {
      return false
    }
  }, [])

  const exportPgn = useCallback(() => currentGame?.pgn ?? game.pgn(), [currentGame, game])
  const exportFen = useCallback(() => currentGame?.fen ?? game.fen(), [currentGame, game])

  const undoMove = useCallback(() => {
    if (currentGame) {
      toast.info("Undo is only available in local review mode.")
      return false
    }
    const gameCopy = new Chess(localGame.fen())
    const undone = gameCopy.undo()
    if (!undone) return false
    setLocalGame(gameCopy)
    return true
  }, [currentGame, localGame])

  const resignGame = useCallback(async () => {
    if (!currentGame || !token) {
      toast.info("Start a live game before resigning.")
      return
    }
    try {
      const response = await gamesApi.resign(token, currentGame.gameId)
      applyGameUpdate(response)
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to resign game."))
    }
  }, [applyGameUpdate, currentGame, token])

  const offerDraw = useCallback(async () => {
    if (!currentGame || !token) {
      toast.info("Start a live game before offering a draw.")
      return
    }
    try {
      const response = await gamesApi.drawOffer(token, currentGame.gameId)
      applyGameUpdate(response)
      toast.success("Draw offer sent.")
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to offer draw."))
    }
  }, [applyGameUpdate, currentGame, token])

  const respondToDraw = useCallback(
    async (accepted: boolean) => {
      if (!currentGame || !token) return
      try {
        const response = await gamesApi.drawRespond(token, currentGame.gameId, accepted)
        applyGameUpdate(response)
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to respond to draw offer."))
      }
    },
    [applyGameUpdate, currentGame, token],
  )

  const startBotGame = useCallback(
    async (config: BotConfig) => {
      if (!ensureAuthenticated() || !token) return false
      let color: "white" | "black" =
        config.color === "random"
          ? Math.random() > 0.5
            ? "white"
            : "black"
          : config.color

      try {
        const level = Math.min(10, Math.max(1, config.level))
        const response = await botGamesApi.create(token, { level, color })
        setBotConfig({ ...config, color })
        setChatMessages([])
        applyGameUpdate(response)
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to start bot game."))
        return false
      }
    },
    [applyGameUpdate, ensureAuthenticated, token],
  )

  const resetGame = useCallback(
    async (options?: { orientation?: "white" | "black"; botConfig?: BotConfig | null }) => {
      if (options?.orientation) {
        setBoardOrientation(options.orientation)
      }

      if (options?.botConfig) {
        await startBotGame(options.botConfig)
        return
      }

      setCurrentGame(null)
      setChatMessages([])
      setBotConfig(null)
      setLocalGame(new Chess())
    },
    [startBotGame],
  )

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!currentGame || !token) {
        toast.info("Start a live game before sending chat.")
        return
      }

      try {
        const response = await gamesApi.sendChat(token, currentGame.gameId, { message })
        appendChatMessage(response)
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to send chat message."))
      }
    },
    [appendChatMessage, currentGame, token],
  )

  const startMatchmaking = useCallback(async () => {
    if (!ensureAuthenticated() || !token) return

    setIsSearchingMatch(true)
    try {
      const response = await matchmakingApi.join(token, {
        timeControl: settings.defaultTimeControl,
        rated: true,
      })
      setMatchmakingStatus(response)
      if (response.matchedGameId) {
        await loadGameById(response.matchedGameId)
        setIsSearchingMatch(false)
      } else {
        setIsSearchingMatch(response.searching)
      }
    } catch (error) {
      setIsSearchingMatch(false)
      toast.error(getErrorMessage(error, "Unable to join matchmaking."))
    }
  }, [ensureAuthenticated, loadGameById, settings.defaultTimeControl, token])

  const cancelMatchmaking = useCallback(async () => {
    if (!token) return
    try {
      const response = await matchmakingApi.cancel(token)
      setMatchmakingStatus(response)
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to cancel matchmaking."))
    } finally {
      setIsSearchingMatch(false)
    }
  }, [token])

  const value = useMemo<GameContextType>(
    () => ({
      game,
      fen: game.fen(),
      backendFen: currentGame?.fen ?? null,
      history,
      evaluation,
      whiteTime,
      blackTime,
      lastMove,
      isWhiteTurn: currentGame ? currentGame.turnColor === "white" : game.turn() === "w",
      boardOrientation,
      timeControl,
      result,
      botConfig,
      currentGame,
      currentGameId: currentGame?.gameId ?? null,
      chatMessages,
      matchmakingStatus,
      isLoadingGame,
      isSubmittingMove,
      isSearchingMatch,
      makeMove,
      loadFen,
      loadPgn,
      exportPgn,
      exportFen,
      resetGame,
      undoMove,
      resignGame,
      offerDraw,
      respondToDraw,
      setBoardOrientation,
      startBotGame,
      loadGameById,
      sendChatMessage,
      refreshChat,
      applyGameUpdate,
      appendChatMessage,
      startMatchmaking,
      cancelMatchmaking,
    }),
    [
      game,
      currentGame,
      history,
      evaluation,
      whiteTime,
      blackTime,
      lastMove,
      boardOrientation,
      timeControl,
      result,
      botConfig,
      chatMessages,
      matchmakingStatus,
      isLoadingGame,
      isSubmittingMove,
      isSearchingMatch,
      makeMove,
      loadFen,
      loadPgn,
      exportPgn,
      exportFen,
      resetGame,
      undoMove,
      resignGame,
      offerDraw,
      respondToDraw,
      startBotGame,
      loadGameById,
      sendChatMessage,
      refreshChat,
      applyGameUpdate,
      appendChatMessage,
      startMatchmaking,
      cancelMatchmaking,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
