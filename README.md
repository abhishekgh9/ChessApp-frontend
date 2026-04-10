# ChessMaster Pro Frontend To Spring Boot Backend Handoff

This README is written to be handed directly to a Java Spring Boot backend engineer or backend AI agent.

The frontend already exists and exposes multiple real user flows. Some of those flows currently run on local state, mock data, or localStorage. The Spring Boot backend should now implement real persistence, authentication, gameplay orchestration, analysis services, and WebSocket messaging so the frontend can switch from simulated behavior to server-authoritative behavior.

The backend should be designed to support a production-style chess platform similar in scope to Chess.com or Lichess for the features already visible in the frontend.

## Objective

Build a Spring Boot backend that supports all frontend-implemented features, including:

1. authentication
2. user settings/preferences
3. multiplayer chess games
4. bot games
5. analysis endpoints
6. leaderboard data
7. profile data
8. game archive and PGN/FEN persistence
9. game chat
10. matchmaking
11. WebSocket/STOMP real-time messaging

The backend should become the source of truth for all persisted and competitive state.

## Frontend Product Summary

The frontend currently includes these pages and feature groups:

1. `/`
   Play page with chess board, move controls, clocks, chat, move list, bot modal, game-over flow, and settings.
2. `/analysis`
   Analysis/study page with board navigation, PGN import, FEN copy, move list, and analysis placeholders.
3. `/leaderboard`
   Rankings page with time-control tabs, search, and ranked player cards.
4. `/profile`
   Profile dashboard with ratings, statistics, recent games, and achievements.
5. global auth flow
   Login, register, logout, current-user awareness.
6. global settings flow
   Board theme, default time control, sound toggles, notification toggles.

## Frontend Stack Context

Frontend stack:

1. Next.js App Router
2. React
3. TypeScript
4. Tailwind-based UI
5. `chess.js` for client move validation and board state
6. `react-chessboard` for board rendering
7. existing STOMP-style WebSocket hook in `hooks/useChessSocket.ts`

The Spring Boot backend should be designed for a Next.js frontend consuming JSON APIs and STOMP WebSocket messages.

## Existing Frontend Files And What They Expect

### App Shell

`app/layout.tsx`

1. Root app layout.
2. Wraps the app in providers.

`app/providers.tsx`

1. Initializes auth provider.
2. Initializes settings provider.
3. Initializes toast system.

`components/chess/app-layout.tsx`

1. Shared shell for all pages.
2. Contains desktop/mobile navigation.
3. Contains account dropdown.
4. Opens auth/settings modals.

### Authentication

`components/chess/auth-context.tsx`

Current frontend behavior:

1. stores users locally in `localStorage`
2. stores session locally in `localStorage`
3. supports register/login/logout

Backend replacement required:

1. real Spring Security authentication
2. password hashing
3. JWT or session-backed auth
4. current-user endpoint
5. validation and duplicate-account handling

`components/chess/auth-modal.tsx`

Frontend UI already exists for:

1. login
2. register
3. auth mode switching

### Settings

`components/chess/settings-context.tsx`

Current frontend behavior:

1. stores preferences locally
2. tracks:
   - `moveSounds`
   - `notificationSounds`
   - `gameAlerts`
   - `chatMessages`
   - `boardTheme`
   - `defaultTimeControl`

Backend replacement required:

1. persist settings per user in database
2. return settings after login or via settings endpoint

`components/chess/settings-modal.tsx`

Frontend settings UI already implemented.

### Core Game State

`components/chess/game-context.tsx`

This is the most important frontend state file for backend mapping.

It currently tracks:

1. game object
2. FEN
3. move history
4. evaluation
5. white/black clock values
6. last move
7. board orientation
8. time control
9. result
10. bot config

It currently supports:

1. make move
2. load FEN
3. load PGN
4. export PGN
5. export FEN
6. reset game
7. undo move
8. resign
9. offer draw
10. board orientation change
11. start bot game

Important note:

Much of this is currently simulated in the frontend and must become server-authoritative in Spring Boot for real games.

### Play Experience

`components/chess/chess-board.tsx`

Frontend already implements:

1. move input
2. legal move highlighting
3. last move highlighting
4. clock display
5. evaluation display
6. theme-aware board colors
7. WebSocket hook usage for live game sync

`components/chess/right-sidebar.tsx`

Frontend already implements:

1. move list
2. undo
3. draw
4. resign
5. PGN copy/export
6. FEN copy
7. PGN import
8. local chat UI
9. placeholder analysis controls

`components/chess/play-bot-modal.tsx`

Frontend already implements:

1. bot difficulty selection
2. color selection
3. auth gate before bot game start

`components/chess/game-over-modal.tsx`

Frontend already implements:

1. result summary
2. result reason
3. new game
4. rematch
5. jump to analysis

### Analysis

`app/analysis/page.tsx`

Frontend already implements:

1. board navigation
2. move list
3. PGN import
4. FEN copy
5. placeholder evaluation stats

### Leaderboard

`app/leaderboard/page.tsx`

Frontend already implements:

1. time-control tabs
2. player search input
3. leaderboard cards with rank/rating metadata

### Profile

`app/profile/page.tsx`

Frontend already implements:

1. profile summary
2. rating cards by time control
3. aggregate stats
4. recent games list
5. achievements list
6. auth-aware personalization

### Real-Time Socket Layer

`hooks/useChessSocket.ts`

Current frontend socket expectation:

1. WebSocket endpoint: `ws://localhost:8081/ws-chess`
2. STOMP connect header:
   - `Authorization: Bearer <jwt>`
3. subscribe destination:
   - `/topic/game/{gameId}`
4. publish destination:
   - `/app/game.move`

If possible, keep this contract in Spring Boot so frontend changes stay minimal.

## Spring Boot Architecture Requirements

The backend should be implemented using standard Spring Boot layering and conventions.

Recommended stack:

1. Spring Boot 3+
2. Spring Web
3. Spring Security
4. Spring Data JPA
5. PostgreSQL or MySQL
6. Spring Validation
7. Spring WebSocket with STOMP
8. JWT authentication
9. Lombok if desired
10. Flyway or Liquibase for schema migrations

Recommended package structure:

1. `config`
2. `security`
3. `auth`
4. `user`
5. `settings`
6. `game`
7. `bot`
8. `analysis`
9. `leaderboard`
10. `profile`
11. `matchmaking`
12. `chat`
13. `common`

Recommended layer split per module:

1. `controller`
2. `service`
3. `repository`
4. `entity`
5. `dto`
6. `mapper`

## Required Spring Boot Modules

### 1. Auth Module

Implement:

1. `AuthController`
2. `AuthService`
3. `JwtService`
4. `UserDetailsService` implementation
5. Spring Security filter chain
6. password hashing with BCrypt

Required capabilities:

1. register
2. login
3. logout if token blacklist/session mechanism is used
4. get current user

Suggested endpoints:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/logout`
4. `GET /api/auth/me`

Suggested DTOs:

1. `RegisterRequest`
2. `LoginRequest`
3. `AuthResponse`
4. `UserSummaryResponse`

### 2. User And Settings Module

Implement:

1. `User` entity
2. `UserSettings` entity
3. `UserRepository`
4. `UserSettingsRepository`
5. `SettingsController`
6. `SettingsService`

Required capabilities:

1. fetch settings for authenticated user
2. update settings
3. return settings after login if useful

Suggested endpoints:

1. `GET /api/settings`
2. `PATCH /api/settings`

### 3. Game Module

Implement:

1. `Game` entity
2. `Move` or `GameMove` entity if move history is stored relationally
3. `GameRepository`
4. `GameService`
5. `GameController`
6. clock management strategy
7. server-side chess rules validation

Required capabilities:

1. create game
2. fetch game by ID
3. submit move
4. resign
5. offer/respond to draw
6. return FEN
7. return PGN
8. maintain history
9. maintain clocks
10. maintain result/reason/status

Suggested endpoints:

1. `POST /api/games`
2. `GET /api/games/{gameId}`
3. `POST /api/games/{gameId}/move`
4. `POST /api/games/{gameId}/resign`
5. `POST /api/games/{gameId}/draw-offer`
6. `POST /api/games/{gameId}/draw-respond`
7. `GET /api/games/{gameId}/pgn`
8. `GET /api/games/{gameId}/fen`

Important:

The backend should be authoritative for:

1. move legality
2. game turn
3. game status
4. clocks
5. result calculation

### 4. WebSocket / STOMP Module

Implement Spring WebSocket with STOMP.

Recommended Spring Boot config:

1. websocket endpoint `/ws-chess`
2. app destination prefix `/app`
3. broker destination prefix `/topic`

Required capabilities:

1. authenticate socket connections with JWT
2. subscribe users to game topics
3. broadcast move updates
4. broadcast draw offers
5. broadcast chat messages
6. broadcast game-end events
7. optionally broadcast clock ticks or periodic state snapshots

Frontend currently expects:

1. publish to `/app/game.move`
2. subscribe to `/topic/game/{gameId}`

Recommended Spring components:

1. `WebSocketConfig`
2. `ChannelInterceptor` for JWT auth
3. `GameSocketController`
4. `SimpMessagingTemplate`

### 5. Bot Module

Implement:

1. `BotController`
2. `BotService`
3. integration with chess engine process or chess engine library

Required capabilities:

1. create bot game
2. choose bot difficulty
3. choose player color
4. compute bot moves
5. update game state after each player move

Suggested endpoint:

1. `POST /api/bot-games`

### 6. Analysis Module

Implement:

1. `AnalysisController`
2. `AnalysisService`
3. engine integration for evaluation and best line

Required capabilities:

1. validate PGN
2. validate FEN
3. analyze PGN
4. analyze FEN
5. return best move
6. return evaluation
7. return move classifications
8. return graph-ready evaluation series

Suggested endpoints:

1. `POST /api/analysis/pgn`
2. `POST /api/analysis/fen`
3. `GET /api/analysis/{analysisId}`

### 7. Leaderboard Module

Implement:

1. `LeaderboardController`
2. `LeaderboardService`
3. rating queries by time control

Required capabilities:

1. fetch leaderboard by time control
2. search usernames
3. paginate results
4. include rating change, games played, and win rate

Suggested endpoint:

1. `GET /api/leaderboard?timeControl=blitz&query=magnus&page=0&size=20`

### 8. Profile Module

Implement:

1. `ProfileController`
2. `ProfileService`

Required capabilities:

1. current user profile
2. public profile by user ID or username
3. ratings by time control
4. aggregate game stats
5. recent games
6. achievements

Suggested endpoints:

1. `GET /api/profile/me`
2. `GET /api/profile/{userId}`
3. `GET /api/profile/{userId}/games`
4. `GET /api/profile/{userId}/achievements`

### 9. Chat Module

Implement:

1. `GameChatMessage` entity
2. `ChatController`
3. `ChatService`
4. optional WebSocket chat message handler

Required capabilities:

1. fetch chat history for a game
2. persist game chat messages
3. deliver chat messages via WebSocket

Suggested endpoints:

1. `GET /api/games/{gameId}/chat`
2. `POST /api/games/{gameId}/chat`

### 10. Matchmaking Module

Implement:

1. `MatchmakingController`
2. `MatchmakingService`
3. in-memory queue or distributed queue strategy

Required capabilities:

1. join queue
2. cancel queue
3. find opponent by rating/time control
4. create game when matched
5. notify users in real time

Suggested endpoints:

1. `POST /api/matchmaking/join`
2. `POST /api/matchmaking/cancel`
3. `GET /api/matchmaking/status`

## Backend Domain Model Expected By Frontend

These are the main backend concepts already implied by the frontend.

### User

Fields expected:

1. `id`
2. `username`
3. `email`
4. `passwordHash`
5. `rating`
6. `joinedAt`
7. optional:
   - `avatarUrl`
   - `country`
   - `title`

### UserSettings

Fields expected:

1. `moveSounds`
2. `notificationSounds`
3. `gameAlerts`
4. `chatMessages`
5. `boardTheme`
6. `defaultTimeControl`

### Game

Fields expected:

1. `id`
2. `whitePlayerId`
3. `blackPlayerId`
4. `fen`
5. `pgn`
6. `history`
7. `timeControl`
8. `whiteTimeRemaining`
9. `blackTimeRemaining`
10. `status`
11. `result`
12. `resultReason`
13. `lastMoveFrom`
14. `lastMoveTo`
15. `lastMoveSan`
16. `isBotGame`
17. `botLevel`
18. `createdAt`
19. `updatedAt`

### LeaderboardEntry

Fields expected:

1. `rank`
2. `username`
3. `title`
4. `country`
5. `rating`
6. `change`
7. `gamesPlayed`
8. `winRate`

### ProfileSummary

Fields expected:

1. user summary
2. ratings by time control
3. aggregate stats
4. recent games
5. achievements

### Achievement

Fields expected:

1. `id`
2. `name`
3. `description`
4. `earned`
5. `earnedAt`

### GameChatMessage

Fields expected:

1. `id`
2. `gameId`
3. `senderId`
4. `senderUsername`
5. `message`
6. `createdAt`

## Suggested Spring Boot REST Contracts

### Auth

`POST /api/auth/register`

```json
{
  "username": "TacticalTiger",
  "email": "player@example.com",
  "password": "secure-password"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "username": "TacticalTiger",
    "email": "player@example.com",
    "rating": 1500,
    "joinedAt": "2026-03-27T10:00:00Z"
  },
  "token": "jwt-token"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "player@example.com",
  "password": "secure-password"
}
```

### Create Game

`POST /api/games`

```json
{
  "timeControl": "10+0",
  "rated": true,
  "colorPreference": "random"
}
```

### Submit Move

`POST /api/games/{gameId}/move`

```json
{
  "from": "e2",
  "to": "e4",
  "promotion": "q"
}
```

Response:

```json
{
  "gameId": "game_123",
  "fen": "updated-fen",
  "pgn": "updated-pgn",
  "history": ["e4"],
  "lastMove": {
    "from": "e2",
    "to": "e4",
    "san": "e4"
  },
  "whiteTimeRemaining": 598,
  "blackTimeRemaining": 600,
  "status": "ACTIVE",
  "result": null,
  "resultReason": null
}
```

### Create Bot Game

`POST /api/bot-games`

```json
{
  "level": 3,
  "color": "white"
}
```

### Analyze PGN

`POST /api/analysis/pgn`

```json
{
  "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"
}
```

### Update Settings

`PATCH /api/settings`

```json
{
  "moveSounds": true,
  "notificationSounds": true,
  "gameAlerts": true,
  "chatMessages": true,
  "boardTheme": "classic",
  "defaultTimeControl": "10+0"
}
```

## Frontend Behaviors That Are Fake Today And Must Become Real In Spring Boot

These are the most important replacements.

### Authentication

Currently:

1. localStorage only
2. no real password hashing
3. no real Spring Security session/token validation

Backend must implement real auth.

### Clocks

Currently:

1. countdown happens on client
2. not authoritative

Backend must manage time remaining and end games on timeout.

### Evaluation

Currently:

1. simulated random values on frontend

Backend must provide engine-backed evaluation.

### Bot Games

Currently:

1. frontend creates local bot config
2. no actual engine opponent exists

Backend must integrate a real chess engine or engine service.

### Chat

Currently:

1. messages are local only
2. no persistence
3. no multiplayer delivery

Backend must persist and publish chat.

### Leaderboard And Profile

Currently:

1. mostly mock data

Backend must serve real database-backed data.

### Achievements

Currently:

1. static placeholders

Backend must compute and persist achievements.

## Spring Boot Security Expectations

Use Spring Security for all authenticated APIs.

Recommended approach:

1. JWT-based stateless auth
2. bearer token in `Authorization` header
3. secure password hashing with BCrypt
4. authenticated WebSocket handshake/interceptor
5. method-level authorization where useful

Recommended protected endpoints:

1. `/api/settings/**`
2. `/api/games/**`
3. `/api/bot-games/**`
4. `/api/profile/me`
5. `/api/matchmaking/**`
6. chat endpoints

## Spring Boot WebSocket Expectations

The frontend already expects STOMP-style messaging, so Spring Boot should preferably expose:

1. endpoint: `/ws-chess`
2. application destination prefix: `/app`
3. broker prefix: `/topic`

Recommended events to publish to `/topic/game/{gameId}`:

1. move accepted
2. game state updated
3. draw offered
4. draw accepted or rejected
5. resignation
6. timeout
7. chat message

Recommended payload shape:

```json
{
  "type": "GAME_STATE",
  "gameId": "game_123",
  "fen": "fen-string",
  "pgn": "pgn-string",
  "history": ["e4", "e5"],
  "lastMove": {
    "from": "e7",
    "to": "e5",
    "san": "e5"
  },
  "whiteTimeRemaining": 597,
  "blackTimeRemaining": 598,
  "status": "ACTIVE",
  "result": null,
  "resultReason": null
}
```

## Recommended Persistence Strategy

Use JPA entities and repositories for persisted data.

Suggested entities:

1. `User`
2. `UserSettings`
3. `Game`
4. `GameMove`
5. `GameChatMessage`
6. `Achievement`
7. `UserAchievement`
8. `RatingHistory`
9. `MatchmakingTicket`

Recommended database:

1. PostgreSQL preferred

Recommended migration tool:

1. Flyway or Liquibase

## Recommended Backend Build Order For Spring Boot

1. Spring Security + JWT auth
2. User entity + settings entity + migrations
3. Game entity + move submission + PGN/FEN persistence
4. WebSocket/STOMP integration
5. Bot game service
6. Profile and leaderboard read APIs
7. Analysis endpoints
8. Chat persistence and WebSocket chat events
9. Matchmaking service
10. Achievements and rating history

## Final Prompt For Spring Boot Backend AI Agent

Use this prompt directly if you want:

Build a Java Spring Boot backend for an already-implemented chess frontend called ChessMaster Pro. The frontend already includes pages for `/`, `/analysis`, `/leaderboard`, and `/profile`, plus flows for register, login, logout, user settings, live chess play, bot setup, PGN/FEN handling, profile stats, leaderboard views, game-over handling, and game chat. Replace all local/demo frontend logic with real backend logic.

Use:

1. Spring Boot 3+
2. Spring Web
3. Spring Security with JWT
4. Spring Data JPA
5. PostgreSQL
6. Spring WebSocket with STOMP
7. Flyway or Liquibase

Implement modules for:

1. auth
2. user/settings
3. game
4. bot
5. analysis
6. leaderboard
7. profile
8. chat
9. matchmaking

Requirements:

1. Register, login, logout, and current-user APIs.
2. Persist user settings like board theme and default time control.
3. Build server-authoritative multiplayer games with move validation, clocks, FEN/PGN/history storage, resignation, draw flow, timeout handling, and game result states.
4. Provide STOMP WebSocket support compatible with:
   - endpoint `/ws-chess`
   - publish destination `/app/game.move`
   - subscribe destination `/topic/game/{gameId}`
5. Implement bot game creation with difficulty levels and engine-generated responses.
6. Implement analysis APIs for PGN/FEN validation, best move, evaluation, move classifications, and eval history.
7. Implement leaderboard APIs with time-control filters, search, and pagination.
8. Implement profile APIs with ratings, aggregate stats, recent games, and achievements.
9. Implement game chat persistence and real-time delivery.
10. Implement matchmaking queue/join/cancel/match creation.

Use clean Spring Boot layering with controllers, services, repositories, entities, and DTOs. The backend must become the source of truth for all persisted and competitive state. Keep API response fields aligned with the frontend data described in this README so the frontend can integrate with minimal UI changes.

## Notes

This README is based on the frontend that already exists in this repository. It is not a generic wishlist. The backend should implement the features that are already exposed in the frontend UI and state flows.
