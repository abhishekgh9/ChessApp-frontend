import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function ProductPanel({
  className,
  strong = false,
  children,
}: {
  className?: string
  strong?: boolean
  children: ReactNode
}) {
  return (
    <section className={cn(strong ? "surface-panel-strong" : "surface-panel", className)}>
      {children}
    </section>
  )
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>
    </div>
  )
}

export function InsetPanel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn("surface-inset", className)}>{children}</div>
}

export function DataPill({
  className,
  children,
  tone = "default",
}: {
  className?: string
  children: ReactNode
  tone?: "default" | "accent" | "success" | "warning" | "danger"
}) {
  const toneClassName =
    tone === "accent"
      ? "border-primary/20 bg-primary/12 text-primary"
      : tone === "success"
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        : tone === "warning"
          ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
          : tone === "danger"
            ? "border-red-400/20 bg-red-400/10 text-red-200"
            : "border-white/10 bg-white/[0.04] text-slate-300"

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", toneClassName, className)}>
      {children}
    </span>
  )
}

export function MetricCard({
  label,
  value,
  meta,
  className,
}: {
  label: string
  value: ReactNode
  meta?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("surface-inset p-4", className)}>
      <p className="data-label">{label}</p>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {meta ? <div className="mt-2 text-sm text-muted-foreground">{meta}</div> : null}
    </div>
  )
}
