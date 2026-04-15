"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { AppLayout } from "@/components/chess/app-layout"
import { ChessBoard } from "@/components/chess/chess-board"
import { GameProvider, useGame } from "@/components/chess/game-context"
import { GameOverModal } from "@/components/chess/game-over-modal"
import { MatchmakingOverlay } from "@/components/chess/matchmaking-overlay"
import { PlayBotModal } from "@/components/chess/play-bot-modal"
import { RightSidebar } from "@/components/chess/right-sidebar"

function HomeShell() {
  const searchParams = useSearchParams()
  const [showPlayBotModal, setShowPlayBotModal] = useState(false)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const { result, loadGameById, cancelMatchmaking, isSearchingMatch } = useGame()

  const gameId = searchParams.get("game")

  useEffect(() => {
    if (searchParams.get("bot") === "true") {
      setShowPlayBotModal(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!gameId) return
    void loadGameById(gameId)
  }, [gameId, loadGameById])

  useEffect(() => {
    setShowGameOverModal(Boolean(result))
  }, [result])

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-24 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <ChessBoard gameId={gameId ?? undefined} />
        <div className="min-w-0 xl:sticky xl:top-[104px] xl:h-[calc(100vh-8.5rem)]">
          <RightSidebar />
        </div>
      </div>

      <PlayBotModal open={showPlayBotModal} onOpenChange={setShowPlayBotModal} />
      <GameOverModal open={showGameOverModal} onOpenChange={setShowGameOverModal} />
      <MatchmakingOverlay open={isSearchingMatch} onCancel={() => void cancelMatchmaking()} />
    </AppLayout>
  )
}

function ChessAppContent() {
  return (
    <GameProvider>
      <HomeShell />
    </GameProvider>
  )
}

export default function ChessApp() {
  return (
    <Suspense fallback={null}>
      <ChessAppContent />
    </Suspense>
  )
}
