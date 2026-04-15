import type { ReactNode } from "react"
import { Award, Calendar, ChevronRight } from "lucide-react"

import { InsetPanel, PanelHeader, ProductPanel } from "@/components/design-system/product"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ProfilePanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <ProductPanel className="p-5">
      <PanelHeader title={title} description={description} />
      <div className="mt-4">{children}</div>
    </ProductPanel>
  )
}

export function RecentGameCard({
  gameId,
  statusLabel,
  description,
  meta,
  isFinished,
  index,
}: {
  gameId: string
  statusLabel: string
  description: string
  meta: string
  isFinished: boolean
  index: number
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all lg:flex-row lg:items-center lg:justify-between",
        isFinished ? "border-primary/20 bg-primary/[0.07] hover:bg-primary/[0.11]" : "border-white/10 bg-black/20 opacity-90",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
          #{index + 1}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{gameId}</p>
            <Badge
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                isFinished ? "border-primary/20 bg-primary/12 text-primary" : "border-amber-400/20 bg-amber-400/10 text-amber-200",
              )}
            >
              {statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-400">{description}</p>
          <p className="mt-1 text-xs text-slate-500">{meta}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className={cn("text-slate-400", isFinished && "text-primary")}>
          {isFinished ? "View review" : "Available after completion"}
        </span>
        <ChevronRight className={cn("h-4 w-4", isFinished ? "text-primary" : "text-slate-500")} />
      </div>
    </div>
  )
}

export function AchievementCard({
  name,
  description,
  earned,
  earnedAt,
}: {
  name: string
  description: string
  earned: boolean
  earnedAt?: string | null
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        earned ? "border-primary/20 bg-primary/[0.08]" : "border-white/10 bg-black/20 opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", earned ? "bg-primary/15 text-primary" : "bg-white/[0.06] text-slate-400")}>
          <Award className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-slate-400">{description}</p>
          {earned && earnedAt ? (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary">
              <Calendar className="h-3 w-3" />
              {new Date(earnedAt).toLocaleDateString()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function EmptyInset({ children }: { children: ReactNode }) {
  return <InsetPanel className="p-4 text-sm text-slate-400">{children}</InsetPanel>
}
