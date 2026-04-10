"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  Bot,
  Crown,
  LineChart,
  Menu,
  LogIn,
  LogOut,
  Settings,
  Swords,
  Trophy,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { AuthModal } from "@/components/chess/auth-modal"
import { useAuth } from "@/components/chess/auth-context"
import { SettingsModal } from "@/components/chess/settings-modal"
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
  { icon: LineChart, label: "Analysis", href: "/analysis" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: User, label: "Profile", href: "/profile" },
]

const pageMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/": {
    eyebrow: "Live match",
    title: "Play with focus",
    description: "Board, chat, and analysis arranged for fast decisions on any screen.",
  },
  "/analysis": {
    eyebrow: "Study room",
    title: "Review every variation",
    description: "Step through lines, import PGNs, and inspect the position without losing context.",
  },
  "/leaderboard": {
    eyebrow: "Rankings",
    title: "Track the top players",
    description: "A cleaner leaderboard with stronger hierarchy and easier scanning.",
  },
  "/profile": {
    eyebrow: "Player card",
    title: "See progress clearly",
    description: "Ratings, streaks, and recent performance all in one consistent dashboard.",
  },
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }
  return pathname.startsWith(href)
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, openAuthModal, logout, isBootstrapping } = useAuth()
  const meta = pageMeta[pathname] ?? pageMeta["/"]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(73,158,112,0.22),_transparent_26%),linear-gradient(180deg,_rgba(9,13,12,1)_0%,_rgba(10,15,17,1)_48%,_rgba(7,11,12,1)_100%)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[88px] shrink-0 border-r border-white/10 bg-black/25 backdrop-blur-xl lg:flex">
          <div className="flex w-full flex-col items-center gap-6 px-4 py-6">
            <Link
              href="/"
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-[1.03]"
            >
              <Crown className="h-7 w-7 text-primary" />
              <span className="sr-only">ChessMaster Pro</span>
            </Link>

            <nav className="flex w-full flex-1 flex-col gap-3">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "group flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border transition-all duration-200",
                      active
                        ? "border-primary/40 bg-primary/15 text-primary shadow-[0_12px_30px_rgba(76,178,120,0.18)]"
                        : "border-transparent bg-white/[0.03] text-muted-foreground hover:border-white/10 hover:bg-white/[0.06] hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setShowSettingsModal(true)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.08] lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                    {meta.eyebrow}
                  </p>
                  <div className="flex items-center gap-3">
                    <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">
                      {meta.title}
                    </h1>
                    <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:inline-flex">
                      Production UI refresh
                    </span>
                  </div>
                  <p className="hidden max-w-2xl text-sm text-slate-400 md:block">
                    {meta.description}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
                  Smooth across desktop and mobile
                </div>
                {isBootstrapping ? (
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400">
                    Restoring session...
                  </div>
                ) : isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        {user?.username}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-white/10 bg-[#0f1719] text-slate-100">
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
                          toast.success("Logged out.")
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => openAuthModal("login")}
                    className="rounded-xl"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowSettingsModal(true)}
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>

            {mobileNavOpen && (
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
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                          active
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void logout()
                        toast.success("Logged out.")
                        setMobileNavOpen(false)
                      }}
                      className="justify-start rounded-2xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout {user?.username}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        openAuthModal("login")
                        setMobileNavOpen(false)
                      }}
                      className="justify-start rounded-2xl"
                    >
                      <LogIn className="h-4 w-4" />
                      Login or register
                    </Button>
                  )}
                </div>
              </div>
            )}
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090e10]/90 px-3 py-3 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
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
