import { GameResultCode, GameResultReasonCode } from "@/lib/backend"

type GameWinner = "white" | "black" | "draw" | null

const RESULT_REASON_LABELS: Record<string, string> = {
  CHECKMATE: "Checkmate",
  STALEMATE: "Stalemate",
  THREEFOLD_REPETITION: "Threefold repetition",
  INSUFFICIENT_MATERIAL: "Insufficient material",
  FIFTY_MOVE_RULE: "Fifty-move rule",
  DRAW: "Draw",
  RESIGNATION: "Resignation",
  DRAW_AGREED: "Draw agreed",
}

function titleCaseFallback(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

export function getWinnerFromResult(result: GameResultCode): GameWinner {
  if (result === "WHITE_WIN") return "white"
  if (result === "BLACK_WIN") return "black"
  if (result === "DRAW") return "draw"
  return null
}

export function formatGameResultReason(reason: GameResultReasonCode): string {
  if (!reason) return "Completed"
  if (RESULT_REASON_LABELS[reason]) return RESULT_REASON_LABELS[reason]
  return titleCaseFallback(reason.replaceAll("_", " "))
}

export function buildGameResultSummary(result: GameResultCode, reason: GameResultReasonCode): string {
  const winner = getWinnerFromResult(result)

  if (winner === "draw") {
    if (reason === "STALEMATE") return "Draw by stalemate."
    if (reason === "THREEFOLD_REPETITION") return "Draw by threefold repetition."
    if (reason === "INSUFFICIENT_MATERIAL") return "Draw by insufficient material."
    if (reason === "FIFTY_MOVE_RULE") return "Draw by fifty-move rule."
    if (reason === "DRAW_AGREED") return "Draw by agreement."
    return "Game drawn."
  }

  if (winner === "white" || winner === "black") {
    const side = winner === "white" ? "White" : "Black"
    if (reason === "CHECKMATE") return `${side} wins by checkmate.`
    if (reason === "RESIGNATION") return `${side} wins by resignation.`
    return `${side} wins.`
  }

  return "Game finished."
}
