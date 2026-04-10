"use client"

import { Fragment, useMemo, useState } from "react"
import {
  AlertOctagon,
  AlertTriangle,
  Clipboard,
  Download,
  Eye,
  FlipHorizontal2,
  MessageCircle,
  Power,
  RotateCcw,
  ScrollText,
  Send,
  Sparkles,
  Swords,
  TrendingUp,
  Undo2,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useAuth } from "./auth-context"
import { useGame } from "./game-context"

function Surface({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[26px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function GameTab() {
  const {
    history,
    resetGame,
    undoMove,
    resignGame,
    offerDraw,
    respondToDraw,
    exportPgn,
    exportFen,
    boardOrientation,
    setBoardOrientation,
    loadPgn,
    currentGame,
    matchmakingStatus,
    isSearchingMatch,
    startMatchmaking,
    cancelMatchmaking,
  } = useGame()
  const { isAuthenticated, openAuthModal } = useAuth()
  const [pgnDraft, setPgnDraft] = useState("")

  const moves = useMemo(() => {
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

  const handleCopyPgn = async () => {
    await navigator.clipboard.writeText(exportPgn())
    toast.success("PGN copied.")
  }

  const handleCopyFen = async () => {
    await navigator.clipboard.writeText(exportFen())
    toast.success("FEN copied.")
  }

  const handleImportPgn = () => {
    if (!pgnDraft.trim()) {
      toast.error("Paste a PGN first.")
      return
    }
    const loaded = loadPgn(pgnDraft)
    if (loaded) {
      toast.success("PGN loaded into local review mode.")
      setPgnDraft("")
    } else {
      toast.error("Invalid PGN.")
    }
  }

  const handleFindMatch = async () => {
    if (!isAuthenticated) {
      openAuthModal("login")
      return
    }
    await startMatchmaking()
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <Surface title="Move list" subtitle="Readable move history with current-line emphasis.">
        <ScrollArea className="h-[240px] pr-3">
          {moves.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
              <ScrollText className="h-8 w-8 text-slate-500" />
              <span className="text-sm text-slate-300">
                {currentGame ? "Waiting for the first server move." : "Game hasn&apos;t started yet."}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {currentGame ? "Connected to backend" : "Local review mode"}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1 text-sm">
              {moves.map((move, idx) => (
                <Fragment key={idx}>
                  <span className="pt-2 pr-2 text-xs font-medium tabular-nums text-slate-500">
                    {move.number}.
                  </span>
                  <span className="rounded-xl px-3 py-2 text-left text-slate-200">{move.white}</span>
                  <span className={cn("rounded-xl px-3 py-2 text-left text-slate-200", move.black ? "" : "invisible")}>
                    {move.black || "-"}
                  </span>
                </Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      </Surface>

      <Surface title="Live controls" subtitle="Backend game actions, local review tools, and matchmaking all in one place.">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => void resetGame()}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            <RotateCcw className="h-4 w-4" />
            New
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const success = undoMove()
              success ? toast.success("Last move undone.") : toast.error("Undo is only available in local review.")
            }}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="secondary"
            onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            <FlipHorizontal2 className="h-4 w-4" />
            Flip
          </Button>
          <Button
            variant="secondary"
            onClick={() => void offerDraw()}
            disabled={!currentGame}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            <Swords className="h-4 w-4" />
            Draw
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopyPgn}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            <Download className="h-4 w-4" />
            PGN
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopyFen}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            <Clipboard className="h-4 w-4" />
            FEN
          </Button>
        </div>

        {currentGame?.drawOfferedBy && (
          <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3">
            <p className="text-sm text-amber-100">A draw offer is currently pending on this game.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="rounded-2xl" onClick={() => void respondToDraw(true)}>
                Accept
              </Button>
              <Button variant="secondary" className="rounded-2xl" onClick={() => void respondToDraw(false)}>
                Decline
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Button className="h-12 rounded-2xl" onClick={() => void handleFindMatch()} disabled={isSearchingMatch}>
            <Users className="h-4 w-4" />
            {isSearchingMatch ? "Searching..." : "Find Match"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void cancelMatchmaking()}
            disabled={!isSearchingMatch}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          >
            Cancel Search
          </Button>
        </div>

        {matchmakingStatus && (
          <p className="mt-3 text-sm text-slate-400">
            {matchmakingStatus.searching
              ? `Searching ${matchmakingStatus.timeControl} rated queue...`
              : matchmakingStatus.matchedGameId
                ? "Match found and loaded."
                : "Not currently in matchmaking."}
          </p>
        )}

        <Button
          variant="destructive"
          onClick={() => void resignGame()}
          disabled={!currentGame}
          className="mt-3 h-12 w-full rounded-2xl border border-red-500/20 bg-red-500/15 text-white hover:bg-red-500/20"
        >
          Resign game
        </Button>
      </Surface>

      <Surface title="Import PGN" subtitle="This still works as a local study tool when you want to inspect lines outside a live game.">
        <Textarea
          value={pgnDraft}
          onChange={(e) => setPgnDraft(e.target.value)}
          className="min-h-[120px] rounded-2xl border-white/10 bg-white/[0.04] text-white"
          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5..."
        />
        <Button onClick={handleImportPgn} className="mt-3 h-12 w-full rounded-2xl">
          Load PGN
        </Button>
      </Surface>
    </div>
  )
}

function ChatTab() {
  const { chatMessages, sendChatMessage, currentGame, currentGameId } = useGame()
  const { user } = useAuth()
  const [message, setMessage] = useState("")

  const sendMessage = async () => {
    const trimmed = message.trim()
    if (!trimmed) return
    await sendChatMessage(trimmed)
    setMessage("")
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <Surface
        title="Conversation"
        subtitle={
          currentGameId
            ? "Chat history is loaded from the backend and live updates arrive over STOMP."
            : "Start a backend game to unlock persisted chat."
        }
      >
        <ScrollArea className="h-[280px] pr-3">
          <div className="flex flex-col gap-3">
            {chatMessages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">
                {currentGame ? "No messages yet." : "No active backend game selected."}
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isOwn = msg.senderId === user?.id
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      isOwn ? "ml-6 border-primary/20 bg-primary/12" : "border-white/10 bg-white/[0.04]",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={cn("font-semibold", isOwn ? "text-primary" : "text-slate-300")}>
                        {isOwn ? "You" : msg.senderUsername}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-100">{msg.message}</p>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </Surface>

      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div className="flex gap-3">
          <Input
            placeholder={currentGameId ? "Type a message..." : "Start a live game first"}
            value={message}
            disabled={!currentGameId}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
            className="h-12 rounded-2xl border-white/10 bg-white/[0.05] text-white placeholder:text-slate-500"
          />
          <Button className="h-12 rounded-2xl px-4" onClick={() => void sendMessage()} disabled={!currentGameId}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function AnalysisTab() {
  const { evaluation, exportPgn } = useGame()
  const stats = [
    {
      label: "Brilliant",
      value: evaluation > 1.5 ? "1" : "0",
      icon: Sparkles,
      className: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    },
    {
      label: "Inaccuracies",
      value: "3",
      icon: AlertTriangle,
      className: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    },
    {
      label: "Mistakes",
      value: "1",
      icon: XCircle,
      className: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    },
    {
      label: "Blunders",
      value: Math.abs(evaluation) > 4 ? "1" : "0",
      icon: AlertOctagon,
      className: "border-red-400/25 bg-red-400/10 text-red-300",
    },
  ]

  return (
    <div className="flex h-full flex-col gap-4">
      <Surface title="Engine snapshot" subtitle="These insights are wired for the backend contract, but still reflect placeholder analysis values.">
        <div className="rounded-[22px] border border-white/10 bg-[#0f1618] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Eval trend</p>
              <p className="text-lg font-semibold text-white">Current edge: {evaluation > 0 ? "White" : evaluation < 0 ? "Black" : "Even"}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
            </div>
          </div>
          <div className="h-32 rounded-2xl border border-white/10 bg-black/20 p-3">
            <svg className="h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.5" />
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary"
                points="0,25 10,23 20,20 30,22 40,18 50,15 60,20 70,18 80,12 90,15 100,10"
              />
            </svg>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={cn("rounded-[22px] border p-4", stat.className)}>
            <stat.icon className="h-5 w-5" />
            <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Button
          variant="secondary"
          onClick={() => toast.info("The dedicated analysis page now uses backend placeholder analysis endpoints.")}
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white hover:bg-white/[0.1]"
        >
          <Power className="h-4 w-4" />
          Placeholder Engine
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.success(exportPgn() ? "Use the analysis page for backend PGN analysis on this line." : "Play or import moves first.")
          }
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white hover:bg-white/[0.1]"
        >
          <Eye className="h-4 w-4" />
          Show Best Move
        </Button>
      </div>
    </div>
  )
}

export function RightSidebar() {
  return (
    <aside className="h-full">
      <div className="flex h-full flex-col rounded-[32px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.26)] sm:p-5">
        <div className="mb-4 rounded-[26px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <MessageCircle className="h-4 w-4 text-primary" />
            Match center
          </div>
          <p className="mt-2 text-xl font-semibold text-white">The play surface is now wired to the Spring Boot backend.</p>
          <p className="mt-1 text-sm text-slate-400">
            Game actions, matchmaking, chat history, and PGN/FEN exports now follow the live API contract instead of local-only state.
          </p>
        </div>

        <Tabs defaultValue="game" className="flex h-full min-h-0 flex-col gap-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-[20px] border border-white/10 bg-black/20 p-1">
            <TabsTrigger value="game" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Game
            </TabsTrigger>
            <TabsTrigger value="chat" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Chat
            </TabsTrigger>
            <TabsTrigger value="analysis" className="h-11 rounded-2xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="min-h-0">
            <GameTab />
          </TabsContent>
          <TabsContent value="chat" className="min-h-0">
            <ChatTab />
          </TabsContent>
          <TabsContent value="analysis" className="min-h-0">
            <AnalysisTab />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  )
}
