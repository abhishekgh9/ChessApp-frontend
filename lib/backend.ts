"use client"

import { MovePayload } from "@/lib/chess-move"

export const API_BASE_URL = "http://localhost:8081"
export const WS_URL = "ws://localhost:8081/ws-chess"

export interface BackendErrorResponse {
  timestamp?: string
  status: number
  error: string
  details?: Record<string, string>
}

export class BackendError extends Error {
  status: number
  code: string
  details?: Record<string, string>

  constructor(payload: BackendErrorResponse) {
    super(payload.error)
    this.name = "BackendError"
    this.status = payload.status
    this.code = payload.error
    this.details = payload.details
  }
}

export interface UserSummary {
  id: string
  username: string
  email: string
  rating: number
  avatarUrl: string | null
  country: string | null
  title: string | null
  joinedAt: string
}

export interface AppSettingsResponse {
  moveSounds: boolean
  notificationSounds: boolean
  gameAlerts: boolean
  chatMessages: boolean
  boardTheme: string
  defaultTimeControl: string
}

export interface AuthResponse {
  token: string
  user: UserSummary
  settings: AppSettingsResponse
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface GameMoveSummary {
  from?: string
  to?: string
  san?: string
  promotion?: string | null
  [key: string]: unknown
}

export type GameStatus = "WAITING" | "ACTIVE" | "FINISHED" | string
export type GameResultCode = "WHITE_WIN" | "BLACK_WIN" | "DRAW" | null
export type GameResultReasonCode =
  | "CHECKMATE"
  | "STALEMATE"
  | "THREEFOLD_REPETITION"
  | "INSUFFICIENT_MATERIAL"
  | "FIFTY_MOVE_RULE"
  | "DRAW"
  | "RESIGNATION"
  | "DRAW_AGREED"
  | string
  | null

export interface GameResponse {
  gameId: string
  whitePlayerId: string | null
  blackPlayerId: string | null
  // Canonical board state in standard 6-field FEN format.
  fen: string
  // Canonical PGN text with headers, SAN moves, and result.
  pgn: string
  // Canonical move history as SAN entries. Legacy cached snapshots may still include object entries.
  history: Array<string | GameMoveSummary>
  timeControl: string
  whiteTimeRemaining: number
  blackTimeRemaining: number
  status: GameStatus
  result: GameResultCode
  resultReason: GameResultReasonCode
  lastMove: GameMoveSummary | null
  rated: boolean
  isBotGame: boolean
  botLevel: number | null
  turnColor: "white" | "black"
  drawOfferedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface GameChatMessageResponse {
  id: string
  gameId: string
  senderId: string
  senderUsername: string
  message: string
  createdAt: string
}

export interface MatchmakingStatusResponse {
  searching: boolean
  timeControl: string
  rated: boolean
  matchedGameId: string | null
}

export interface ProfileResponse {
  user: UserSummary
  ratings: Record<string, number>
  aggregateStats: {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
  }
  recentGames: Array<Record<string, unknown>>
  achievements: AchievementResponse[]
}

export interface AchievementResponse {
  id: string
  name: string
  description: string
  earned: boolean
  earnedAt: string | null
}

export interface LeaderboardEntry {
  rank: number
  username: string
  title: string | null
  country: string | null
  rating: number
  change: number
  gamesPlayed: number
  winRate: number
}

export type FideTimeControl = "standard" | "rapid" | "blitz"
export type FideGenderFilter = "open" | "male" | "female"
export type FideDivisionFilter = "open" | "junior" | "senior"

export interface FideLeaderboardEntry {
  rank: number
  fideId: number
  name: string
  title: string | null
  country: string | null
  gender: string | null
  birthYear: number | null
  timeControl: FideTimeControl
  rating: number
  gamesPlayed: number | null
  inactive: boolean
}

export interface FideLeaderboardResponse {
  timeControl: FideTimeControl
  gender: FideGenderFilter
  division: FideDivisionFilter
  country: string | null
  query: string | null
  page: number
  size: number
  totalEntries: number
  lastSyncedAt: string | null
  entries: FideLeaderboardEntry[]
}

export interface FideLeaderboardParams {
  query?: string
  timeControl?: FideTimeControl
  country?: string
  gender?: FideGenderFilter
  division?: FideDivisionFilter
  page?: number
  size?: number
  activeOnly?: boolean
}

export type PuzzleDifficulty = "easy" | "medium" | "hard"

export interface PuzzleSummary {
  id: string
  title: string
  description: string
  fen: string
  difficulty: PuzzleDifficulty
  primaryTheme: string
  tags: string[]
  maxWrongAttempts: number
  totalSolutionSteps: number
}

export interface PuzzleListResponse {
  items: PuzzleSummary[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface DailyPuzzleResponse extends PuzzleSummary {
  dailyDate: string
}

export interface PuzzleAttemptRequest {
  move: string
  timeSpentSeconds: number
  hintsUsed: number
}

export interface PuzzleAttemptResponse {
  attemptId: string
  puzzleId: string
  status: "correct" | "incorrect" | "completed" | "failed"
  correct: boolean
  completed: boolean
  failed: boolean
  attemptCount: number
  remainingAttempts: number
  solvedSteps: number
  totalSteps: number
  awardedScore: number
  currentStreak: number
  fen: string
  message: string
}

export interface PuzzleProgressResponse {
  attemptedCount: number
  solvedCount: number
  successRate: number
  currentStreak: number
  bestStreak: number
}

export interface AnalysisResponse {
  analysisId: string
  sourceType: string
  bestMove: string | null
  evaluation: number
  evaluationSeries: number[]
  moveClassifications: string[]
  valid: boolean
}

export interface PostGameAnalysisPlayerSummary {
  playerId: string
  color: "white" | "black"
  accuracy: number
  currentRating: number
  provisionalRating: number
  ratingDelta: number
  movesAnalyzed: number
}

export interface PostGameAnalysisMove {
  moveNumber: number
  color: "white" | "black"
  playerId: string
  uciMove: string
  bestMove: string | null
  evaluationAfter: number
  classification: "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder"
  accuracy: number
}

export interface PostGameAnalysisResponse {
  gameId: string
  status: "FINISHED"
  result: "WHITE_WIN" | "BLACK_WIN" | "DRAW"
  overallAccuracy: number
  white: PostGameAnalysisPlayerSummary
  black: PostGameAnalysisPlayerSummary
  requestedPlayer: PostGameAnalysisPlayerSummary
  moves: PostGameAnalysisMove[]
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  token?: string | null
  body?: unknown
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new BackendError(
      payload ?? {
        status: response.status,
        error: response.statusText || "request_failed",
      },
    )
  }

  return payload as T
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  return parseResponse<T>(response)
}

export const authApi = {
  register: (body: RegisterRequest) =>
    apiRequest<AuthResponse>("/api/auth/register", { method: "POST", body }),
  login: (body: LoginRequest) =>
    apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body }),
  me: (token: string) =>
    apiRequest<AuthResponse>("/api/auth/me", { method: "GET", token }),
  logout: () =>
    apiRequest<void>("/api/auth/logout", { method: "POST" }),
}

export const settingsApi = {
  get: (token: string) =>
    apiRequest<AppSettingsResponse>("/api/settings", { method: "GET", token }),
  patch: (token: string, body: Partial<AppSettingsResponse>) =>
    apiRequest<AppSettingsResponse>("/api/settings", { method: "PATCH", token, body }),
}

export const gamesApi = {
  create: (token: string, body: { timeControl: string; rated: boolean; colorPreference: "white" | "black" | "random" }) =>
    apiRequest<GameResponse>("/api/games", { method: "POST", token, body }),
  get: (token: string, gameId: string) =>
    apiRequest<GameResponse>(`/api/games/${gameId}`, { method: "GET", token }),
  move: (token: string, gameId: string, body: MovePayload) =>
    apiRequest<GameResponse>(`/api/games/${gameId}/move`, { method: "POST", token, body }),
  resign: (token: string, gameId: string) =>
    apiRequest<GameResponse>(`/api/games/${gameId}/resign`, { method: "POST", token }),
  drawOffer: (token: string, gameId: string) =>
    apiRequest<GameResponse>(`/api/games/${gameId}/draw-offer`, { method: "POST", token }),
  drawRespond: (token: string, gameId: string, accepted: boolean) =>
    apiRequest<GameResponse>(`/api/games/${gameId}/draw-respond`, { method: "POST", token, body: { accepted } }),
  pgn: (token: string, gameId: string) =>
    apiRequest<{ pgn: string }>(`/api/games/${gameId}/pgn`, { method: "GET", token }),
  fen: (token: string, gameId: string) =>
    apiRequest<{ fen: string }>(`/api/games/${gameId}/fen`, { method: "GET", token }),
  analysis: (token: string, gameId: string) =>
    apiRequest<PostGameAnalysisResponse>(`/api/games/${gameId}/analysis`, { method: "GET", token }),
  chatHistory: (token: string, gameId: string) =>
    apiRequest<GameChatMessageResponse[]>(`/api/games/${gameId}/chat`, { method: "GET", token }),
  sendChat: (token: string, gameId: string, body: { message: string }) =>
    apiRequest<GameChatMessageResponse>(`/api/games/${gameId}/chat`, { method: "POST", token, body }),
}

export const botGamesApi = {
  create: (token: string, body: { level: number; color: "white" | "black" }) =>
    apiRequest<GameResponse>("/api/bot-games", { method: "POST", token, body }),
}

export const profileApi = {
  me: (token: string) =>
    apiRequest<ProfileResponse>("/api/profile/me", { method: "GET", token }),
  byUser: (userId: string) =>
    apiRequest<ProfileResponse>(`/api/profile/${userId}`, { method: "GET" }),
  games: (userId: string) =>
    apiRequest<Array<Record<string, unknown>>>(`/api/profile/${userId}/games`, { method: "GET" }),
  achievements: (userId: string) =>
    apiRequest<AchievementResponse[]>(`/api/profile/${userId}/achievements`, { method: "GET" }),
}

export const leaderboardApi = {
  list: (query?: string) =>
    apiRequest<LeaderboardEntry[]>(`/api/leaderboard${query ? `?query=${encodeURIComponent(query)}` : ""}`, { method: "GET" }),
  fideList: (params: FideLeaderboardParams = {}) => {
    const searchParams = new URLSearchParams()

    if (params.query) searchParams.set("query", params.query)
    if (params.timeControl) searchParams.set("timeControl", params.timeControl)
    if (params.country) searchParams.set("country", params.country)
    if (params.gender) searchParams.set("gender", params.gender)
    if (params.division) searchParams.set("division", params.division)
    if (params.page !== undefined) searchParams.set("page", String(params.page))
    if (params.size !== undefined) searchParams.set("size", String(params.size))
    if (params.activeOnly !== undefined) searchParams.set("activeOnly", String(params.activeOnly))

    const query = searchParams.toString()
    return apiRequest<FideLeaderboardResponse>(`/api/leaderboard/fide${query ? `?${query}` : ""}`, { method: "GET" })
  },
}

export const analysisApi = {
  fromPgn: (pgn: string) =>
    apiRequest<AnalysisResponse>("/api/analysis/pgn", { method: "POST", body: { pgn } }),
  fromFen: (fen: string) =>
    apiRequest<AnalysisResponse>("/api/analysis/fen", { method: "POST", body: { fen } }),
}

export const puzzlesApi = {
  list: (params: {
    difficulty?: PuzzleDifficulty
    theme?: string
    page?: number
    size?: number
  } = {}) => {
    const searchParams = new URLSearchParams()

    if (params.difficulty) searchParams.set("difficulty", params.difficulty)
    if (params.theme) searchParams.set("theme", params.theme)
    if (params.page !== undefined) searchParams.set("page", String(params.page))
    if (params.size !== undefined) searchParams.set("size", String(params.size))

    const query = searchParams.toString()
    return apiRequest<PuzzleListResponse>(`/api/puzzles${query ? `?${query}` : ""}`, { method: "GET" })
  },
  daily: () =>
    apiRequest<DailyPuzzleResponse>("/api/puzzles/daily", { method: "GET" }),
  detail: (id: string) =>
    apiRequest<PuzzleSummary>(`/api/puzzles/${id}`, { method: "GET" }),
  submitAttempt: (token: string, id: string, body: PuzzleAttemptRequest) =>
    apiRequest<PuzzleAttemptResponse>(`/api/puzzles/${id}/attempts`, { method: "POST", token, body }),
  progress: (token: string) =>
    apiRequest<PuzzleProgressResponse>("/api/puzzles/me/progress", { method: "GET", token }),
}

export const matchmakingApi = {
  join: (token: string, body: { timeControl: string; rated: boolean }) =>
    apiRequest<MatchmakingStatusResponse>("/api/matchmaking/join", { method: "POST", token, body }),
  cancel: (token: string) =>
    apiRequest<MatchmakingStatusResponse>("/api/matchmaking/cancel", { method: "POST", token }),
  status: (token: string) =>
    apiRequest<MatchmakingStatusResponse>("/api/matchmaking/status", { method: "GET", token }),
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof BackendError) {
    if (error.code === "illegal_move") {
      return "Illegal move."
    }
    if (error.code === "promotion_required") {
      return "Promotion piece required."
    }
    if (error.code === "validation_failed") {
      return "The request data was invalid."
    }
    if (error.code === "unauthorized") {
      return "Please log in to continue."
    }
    if (error.code === "not_game_participant") {
      return "Only players from this game can view its analysis."
    }
    if (error.code === "game_not_found") {
      return "That game could not be found."
    }
    if (error.code === "game_analysis_requires_finished_game") {
      return "Post-game analysis is only available after the game is finished."
    }
    if (error.code === "game_contains_illegal_moves") {
      return "This game contains illegal moves, so analysis could not be generated."
    }
    if (error.code === "stockfish_unavailable") {
      return "Stockfish is unavailable on the backend right now."
    }
    if (error.code === "stockfish_timeout") {
      return "The engine took too long to respond. Please try again."
    }
    if (error.code === "invalid_move_format") {
      return "Enter a move in UCI format, like e2e4 or a7a8q."
    }
    if (error.code === "puzzle_not_found") {
      return "That puzzle could not be found."
    }
    if (error.code === "puzzle_attempt_locked") {
      return "This puzzle attempt is locked because it was already completed or failed."
    }
    return error.code.replaceAll("_", " ")
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
