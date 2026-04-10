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

export interface GameResponse {
  gameId: string
  whitePlayerId: string | null
  blackPlayerId: string | null
  fen: string
  pgn: string
  history: Array<string | GameMoveSummary>
  timeControl: string
  whiteTimeRemaining: number
  blackTimeRemaining: number
  status: string
  result: string | null
  resultReason: string | null
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
}

export const analysisApi = {
  fromPgn: (pgn: string) =>
    apiRequest<AnalysisResponse>("/api/analysis/pgn", { method: "POST", body: { pgn } }),
  fromFen: (fen: string) =>
    apiRequest<AnalysisResponse>("/api/analysis/fen", { method: "POST", body: { fen } }),
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
      return "That move is illegal in the current position."
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
    return error.code.replaceAll("_", " ")
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
