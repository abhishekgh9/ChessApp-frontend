import { Chess, Square } from "chess.js"

export type PromotionPiece = "q" | "r" | "b" | "n"

export interface MovePayload {
  from: string
  to: string
  promotion?: PromotionPiece
}

export function normalizePromotion(value: unknown): PromotionPiece | undefined {
  if (typeof value !== "string") return undefined

  const normalized = value.toLowerCase()
  if (normalized === "q" || normalized === "r" || normalized === "b" || normalized === "n") {
    return normalized
  }

  return undefined
}

export function createMovePayload(
  chess: Chess,
  from: Square,
  to: Square,
  preferredPromotion?: string | null,
): MovePayload | null {
  const legalMoves = chess.moves({ square: from, verbose: true }).filter((move) => move.to === to)
  if (legalMoves.length === 0) return null

  const requestedPromotion = normalizePromotion(preferredPromotion)
  const promotionMoves = legalMoves.filter((move) => typeof move.promotion === "string")

  if (promotionMoves.length === 0) {
    return { from, to }
  }

  const selectedPromotion =
    (requestedPromotion &&
      promotionMoves.find((move) => move.promotion === requestedPromotion)?.promotion) ??
    promotionMoves.find((move) => move.promotion === "q")?.promotion ??
    normalizePromotion(promotionMoves[0]?.promotion)

  if (!selectedPromotion) {
    return { from, to }
  }

  return { from, to, promotion: selectedPromotion }
}

export function toChessMoveInput(payload: MovePayload) {
  return payload.promotion
    ? { from: payload.from, to: payload.to, promotion: payload.promotion }
    : { from: payload.from, to: payload.to }
}
