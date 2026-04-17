import { useCallback, useEffect, useRef, useState } from "react"
import { Client, IMessage } from "@stomp/stompjs"

import { GameChatMessageResponse, GameResponse, WS_URL } from "@/lib/backend"
import { MovePayload } from "@/lib/chess-move"

interface UseChessSocketProps {
  gameId: string | null
  jwtToken: string | null
  onGameUpdate: (payload: GameResponse) => void
  onChatMessage: (payload: GameChatMessageResponse) => void
}

function parseMessage<T>(message: IMessage) {
  return JSON.parse(message.body) as T
}

function isGameResponse(payload: unknown): payload is GameResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "gameId" in payload &&
      "fen" in payload &&
      "pgn" in payload &&
      "result" in payload &&
      "resultReason" in payload &&
      "status" in payload &&
      "history" in payload &&
      "timeControl" in payload,
  )
}

function isChatResponse(payload: unknown): payload is GameChatMessageResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "senderUsername" in payload &&
      "message" in payload,
  )
}

export const useChessSocket = ({ gameId, jwtToken, onGameUpdate, onChatMessage }: UseChessSocketProps) => {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const onGameUpdateRef = useRef(onGameUpdate)
  const onChatMessageRef = useRef(onChatMessage)

  useEffect(() => {
    onGameUpdateRef.current = onGameUpdate
  }, [onGameUpdate])

  useEffect(() => {
    onChatMessageRef.current = onChatMessage
  }, [onChatMessage])

  useEffect(() => {
    if (!gameId || !jwtToken) return

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${jwtToken}`,
      },
      onConnect: () => {
        setIsConnected(true)

        client.subscribe(`/topic/game/${gameId}`, (message) => {
          if (!message.body) return

          try {
            const payload = parseMessage<unknown>(message)
            if (isGameResponse(payload)) {
              onGameUpdateRef.current(payload)
              return
            }
            if (isChatResponse(payload)) {
              onChatMessageRef.current(payload)
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message", error)
          }
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onWebSocketError: (error) => {
        console.error("WebSocket error", error)
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame.headers["message"])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      void client.deactivate()
      setIsConnected(false)
    }
  }, [gameId, jwtToken])

  const sendMove = useCallback(
    (payload: { gameId: string } & MovePayload) => {
      if (!clientRef.current?.connected) return false
      clientRef.current.publish({
        destination: "/app/game.move",
        body: JSON.stringify(payload),
      })
      return true
    },
    [],
  )

  const sendChat = useCallback((payload: { gameId: string; message: string }) => {
    if (!clientRef.current?.connected) return false
    clientRef.current.publish({
      destination: "/app/game.chat",
      body: JSON.stringify(payload),
    })
    return true
  }, [])

  return { sendMove, sendChat, isConnected }
}
