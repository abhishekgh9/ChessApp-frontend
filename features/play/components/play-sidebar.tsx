"use client"

import { Fragment, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertOctagon,
  AlertTriangle,
  Clipboard,
  Download,
  Eye,
  FlipHorizontal2,
  MessageCircle,
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

import {
  DataPill,
  InsetPanel,
  PanelHeader,
  ProductPanel,
} from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useAuth } from "@/components/chess/auth-context"
import { useGame } from "@/components/chess/game-context"

function SidePanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <ProductPanel className="p-4">
      <PanelHeader title={title} description={description} />
      <div className="mt-4">{children}</div>
    </ProductPanel>
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
      toast.success("Game loaded for review.")
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
      <SidePanel title="Move list" description="Readable notation with fast scanning for the current line.">
        <ScrollArea className="h-[220px] pr-2">
          {moves.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center">
              <ScrollText className="h-7 w-7 text-muted-foreground" />
              <span className="text-sm text-slate-300">
                {currentGame ? "Waiting for the first move." : "No moves yet."}
              </span>
              <span className="data-label">{currentGame ? "Live match" : "Board review"}</span>
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1 text-sm">
              {moves.map((move, idx) => (
                <Fragment key={idx}>
                  <span className="pt-2 pr-2 text-xs font-medium text-muted-foreground">{move.number}.</span>
                  <span className="rounded-lg px-3 py-2 text-slate-200">{move.white}</span>
                  <span className={cn("rounded-lg px-3 py-2 text-slate-200", move.black ? "" : "invisible")}>
                    {move.black || "-"}
                  </span>
                </Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      </SidePanel>

      <SidePanel title="Match controls" description="Board actions, matchmaking, and draw handling in one place.">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => void resetGame()} className="control-base h-11 justify-start">
            <RotateCcw className="h-4 w-4" />
            New game
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const success = undoMove()
              success ? toast.success("Last move undone.") : toast.error("Undo is available in board review.")
            }}
            className="control-base h-11 justify-start"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="secondary"
            onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
            className="control-base h-11 justify-start"
          >
            <FlipHorizontal2 className="h-4 w-4" />
            Flip
          </Button>
          <Button
            variant="secondary"
            onClick={() => void offerDraw()}
            disabled={!currentGame}
            className="control-base h-11 justify-start"
          >
            <Swords className="h-4 w-4" />
            Offer draw
          </Button>
          <Button variant="secondary" onClick={handleCopyPgn} className="control-base h-11 justify-start">
            <Download className="h-4 w-4" />
            Copy PGN
          </Button>
          <Button variant="secondary" onClick={handleCopyFen} className="control-base h-11 justify-start">
            <Clipboard className="h-4 w-4" />
            Copy FEN
          </Button>
        </div>

        {currentGame?.drawOfferedBy ? (
          <InsetPanel className="mt-3 p-3">
            <p className="text-sm text-slate-200">A draw offer is waiting for your decision.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="control-base" onClick={() => void respondToDraw(true)}>
                Accept
              </Button>
              <Button variant="secondary" className="control-base" onClick={() => void respondToDraw(false)}>
                Decline
              </Button>
            </div>
          </InsetPanel>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Button onClick={() => void handleFindMatch()} disabled={isSearchingMatch} className="h-11 justify-start">
            <Users className="h-4 w-4" />
            {isSearchingMatch ? "Searching..." : "Find match"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void cancelMatchmaking()}
            disabled={!isSearchingMatch}
            className="control-base h-11 justify-start"
          >
            Cancel search
          </Button>
        </div>

        {matchmakingStatus ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {matchmakingStatus.searching
              ? `Searching ${matchmakingStatus.timeControl} queue...`
              : matchmakingStatus.matchedGameId
                ? "Match found."
                : "Not searching right now."}
          </p>
        ) : null}

        <Button variant="destructive" onClick={() => void resignGame()} disabled={!currentGame} className="mt-3 h-11 w-full">
          Resign
        </Button>
      </SidePanel>

      <SidePanel title="Import PGN" description="Load a score sheet to review it on the live board.">
        <Textarea
          value={pgnDraft}
          onChange={(event) => setPgnDraft(event.target.value)}
          className="control-base min-h-[120px] rounded-xl text-white"
          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5..."
        />
        <Button onClick={handleImportPgn} className="mt-3 h-11 w-full">
          Load PGN
        </Button>
      </SidePanel>
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
      <SidePanel
        title="Conversation"
        description={currentGameId ? "Match chat updates in real time during live play." : "Start a live match to open chat."}
      >
        <ScrollArea className="h-[280px] pr-2">
          <div className="flex flex-col gap-3">
            {chatMessages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-muted-foreground">
                {currentGame ? "No messages yet." : "Chat becomes available during live matches."}
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isOwn = msg.senderId === user?.id

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-xl border px-4 py-3",
                      isOwn ? "ml-6 border-primary/20 bg-primary/12" : "border-white/10 bg-white/[0.03]",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={cn("font-semibold", isOwn ? "text-primary" : "text-slate-300")}>
                        {isOwn ? "You" : msg.senderUsername}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
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
      </SidePanel>

      <ProductPanel className="p-4">
        <div className="flex gap-3">
          <Input
            placeholder={currentGameId ? "Type a message..." : "Live match required"}
            value={message}
            disabled={!currentGameId}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void sendMessage()}
            className="control-base h-11"
          />
          <Button className="h-11 px-4" onClick={() => void sendMessage()} disabled={!currentGameId}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </ProductPanel>
    </div>
  )
}

function AnalysisTab() {
  const { evaluation, exportPgn } = useGame()

  const stats = [
    { label: "Brilliant", value: evaluation > 1.5 ? "1" : "0", icon: Sparkles, className: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" },
    { label: "Inaccuracies", value: "3", icon: AlertTriangle, className: "border-amber-400/20 bg-amber-400/10 text-amber-300" },
    { label: "Mistakes", value: "1", icon: XCircle, className: "border-orange-400/20 bg-orange-400/10 text-orange-300" },
    { label: "Blunders", value: Math.abs(evaluation) > 4 ? "1" : "0", icon: AlertOctagon, className: "border-red-400/20 bg-red-400/10 text-red-300" },
  ]

  return (
    <div className="flex h-full flex-col gap-4">
      <SidePanel title="Position snapshot" description="A quick quality read before deeper review.">
        <InsetPanel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="data-label">Current edge</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {evaluation > 0 ? "White" : evaluation < 0 ? "Black" : "Balanced"}
              </p>
            </div>
            <DataPill tone="accent">
              <TrendingUp className="h-4 w-4" />
              {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
            </DataPill>
          </div>
          <div className="h-28 rounded-xl border border-white/10 bg-black/20 p-3">
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
        </InsetPanel>
      </SidePanel>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={cn("rounded-xl border p-4", stat.className)}>
            <stat.icon className="h-5 w-5" />
            <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <ProductPanel className="p-4">
        <div className="grid gap-3">
          <Button
            variant="secondary"
            onClick={() => toast.info("Open the analysis page for full review tools.")}
            className="control-base h-11 justify-start"
          >
            <Eye className="h-4 w-4" />
            Open full analysis
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.success(exportPgn() ? "PGN ready for analysis." : "Play or import moves first.")}
            className="control-base h-11 justify-start"
          >
            <Sparkles className="h-4 w-4" />
            Send current line to analysis
          </Button>
        </div>
      </ProductPanel>
    </div>
  )
}

export function PlaySidebar() {
  return (
    <aside className="h-full">
      <ProductPanel strong className="flex h-full flex-col p-4 sm:p-5">
        <div className="border-b border-white/10 pb-4">
          <PanelHeader
            eyebrow="Operations"
            title="Match center"
            description="Everything around the board stays structured, compact, and ready during play."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <DataPill tone="success">
              <span className="status-dot bg-emerald-400" />
              Live actions
            </DataPill>
            <DataPill>PGN and FEN exports</DataPill>
          </div>
        </div>

        <Tabs defaultValue="game" className="mt-4 flex h-full min-h-0 flex-col gap-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1">
            <TabsTrigger value="game" className="rounded-lg data-[state=active]:bg-primary/12 data-[state=active]:text-primary">
              Game
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-primary/12 data-[state=active]:text-primary">
              Chat
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-primary/12 data-[state=active]:text-primary">
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
      </ProductPanel>
    </aside>
  )
}
