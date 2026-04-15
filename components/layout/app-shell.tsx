"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  ChevronDown,
  Crown,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  Puzzle,
  Settings,
  Swords,
  Trophy,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/chess/auth-context"
import { AuthModal } from "@/components/chess/auth-modal"
import { SettingsModal } from "@/components/chess/settings-modal"
import { DataPill } from "@/components/design-system/product"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Swords, label: "Play", href: "/" },
  { icon: Bot, label: "Play Bot", href: "/?bot=true" },
  { icon: Puzzle, label: "Puzzles", href: "/puzzles" },
  { icon: LineChart, label: "Analysis", href: "/analysis" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: User, label: "Profile", href: "/profile" },
]

const pageMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/": {
    eyebrow: "Live play",
    title: "Competitive play, without noise",
    description: "Board-first workspace for live games, training, and match control.",
  },
  "/analysis": {
    eyebrow: "Analysis",
    title: "Review critical decisions with context",
    description: "Replay lines, inspect turning points, and keep the board at the center of study.",
  },
  "/leaderboard": {
    eyebrow: "Rankings",
    title: "Follow the strongest players",
    description: "Clear ranking tables for internal competition and official federation views.",
  },
  "/profile": {
    eyebrow: "Profile",
    title: "Measure progress over time",
    description: "Ratings, recent results, and achievements organized for fast reading.",
  },
  "/puzzles": {
    eyebrow: "Puzzles",
    title: "Train with tactical puzzle sets",
    description: "Browse daily and themed puzzles, solve from FEN, and track your solving streak.",
  },
  "/puzzles/progress": {
    eyebrow: "Puzzle progress",
    title: "Track puzzle accuracy and streaks",
    description: "See how many puzzles you solved, current streak momentum, and success rate.",
  },
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname.startsWith(href)
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const meta =
    pageMeta[pathname] ??
    (pathname.startsWith("/puzzles") ? pageMeta["/puzzles"] : undefined) ??
    pageMeta["/"]
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const { user, isAuthenticated, isBootstrapping, openAuthModal, logout } = useAuth()

  return (
    <div className="app-shell">
      <div className="app-grid">
        <aside className="shell-nav hidden w-[88px] shrink-0 border-r lg:flex">
          <div className="flex w-full flex-col items-center gap-5 px-4 py-6">
            <Link
              href="/"
              className="surface-panel-strong flex h-14 w-14 items-center justify-center rounded-2xl transition-colors hover:border-primary/30"
            >
              <Crown className="h-6 w-6 text-primary" />
              <span className="sr-only">ChessMaster</span>
            </Link>

            <nav className="flex w-full flex-1 flex-col gap-2">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href)

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary/25 bg-primary/12 text-primary"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setShowSettingsModal(true)}
              className="control-base text-muted-foreground hover:bg-white/[0.04] hover:text-white"
            >
              <Settings className="h-[18px] w-[18px]" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shell-header sticky top-0 z-40 border-b">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  className="control-base mt-1 lg:hidden"
                >
                  <Menu className="h-[18px] w-[18px]" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>

                <div className="min-w-0">
                  <p className="section-eyebrow">{meta.eyebrow}</p>
                  <h1 className="font-display text-2xl leading-none text-white sm:text-[2rem]">{meta.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-[0.95rem]">
                    {meta.description}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <DataPill>{isBootstrapping ? "Restoring session" : "Operational"}</DataPill>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="control-base px-3 text-slate-100 hover:bg-white/[0.04]">
                        <User className="h-4 w-4" />
                        {user?.username}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-white/10 bg-[#131922] text-slate-100">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          void logout()
                          toast.success("Signed out.")
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button onClick={() => openAuthModal("login")} className="rounded-xl px-4">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowSettingsModal(true)}
                  className="control-base px-3 text-slate-100 hover:bg-white/[0.04]"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>

            {mobileNavOpen ? (
              <div className="border-t border-white/10 px-4 py-4 lg:hidden">
                <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {navItems.map((item) => {
                    const active = isActivePath(pathname, item.href)

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "control-base flex items-center gap-3 px-4 py-3 transition-colors",
                          active
                            ? "border-primary/25 bg-primary/12 text-primary"
                            : "text-slate-300 hover:bg-white/[0.03]",
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
        </div>
      </div>

      <nav className="shell-header fixed inset-x-0 bottom-0 z-50 border-t px-3 py-3 lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
      <AuthModal />
    </div>
  )
}
