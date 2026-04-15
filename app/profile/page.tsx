"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  Clock,
  Edit2,
  Target,
  Zap,
} from "lucide-react"

import { AppLayout } from "@/components/chess/app-layout"
import { useAuth } from "@/components/chess/auth-context"
import { InsetPanel, MetricCard, ProductPanel } from "@/components/design-system/product"
import {
  AchievementCard,
  EmptyInset,
  ProfilePanel as Panel,
  RecentGameCard,
} from "@/features/profile/components/profile-ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { profileApi, ProfileResponse } from "@/lib/backend"
import { cn } from "@/lib/utils"

const timeControls = ["bullet", "blitz", "rapid"] as const

type RecentGameRecord = {
  gameId: string
  status: string | null
  result: string | null
  createdAt: string | null
  updatedAt: string | null
  timeControl: string | null
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null
}

function toRecentGameRecord(game: Record<string, unknown>): RecentGameRecord | null {
  const gameId = readString(game.gameId)
  if (!gameId) {
    return null
  }

  return {
    gameId,
    status: readString(game.status),
    result: readString(game.result),
    createdAt: readString(game.createdAt),
    updatedAt: readString(game.updatedAt),
    timeControl: readString(game.timeControl),
  }
}

function formatResult(result: string | null) {
  if (!result) {
    return "Result unavailable"
  }

  switch (result) {
    case "WHITE_WIN":
      return "White won"
    case "BLACK_WIN":
      return "Black won"
    case "DRAW":
      return "Draw"
    default:
      return result.replaceAll("_", " ")
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [selectedTimeControl, setSelectedTimeControl] = useState<typeof timeControls[number]>("blitz")
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, token, isAuthenticated, openAuthModal } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setProfile(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    void profileApi
      .me(token)
      .then((response) => {
        if (cancelled) return
        setProfile(response)
      })
      .catch(() => {
        if (cancelled) return
        setProfile(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, token])

  const aggregateStats = profile?.aggregateStats ?? {
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
  }

  const winRate = aggregateStats.gamesPlayed ? Math.round((aggregateStats.wins / aggregateStats.gamesPlayed) * 100) : 0
  const drawRate = aggregateStats.gamesPlayed ? Math.round((aggregateStats.draws / aggregateStats.gamesPlayed) * 100) : 0
  const lossRate = aggregateStats.gamesPlayed ? Math.round((aggregateStats.losses / aggregateStats.gamesPlayed) * 100) : 0

  const ratingIcons = {
    bullet: Zap,
    blitz: Clock,
    rapid: Target,
  }

  const selectedRatings = useMemo(() => profile?.ratings ?? {}, [profile])
  const recentGames = useMemo(
    () => (profile?.recentGames ?? []).map((game) => toRecentGameRecord(game)).filter((game): game is RecentGameRecord => Boolean(game)),
    [profile?.recentGames],
  )

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-24">
        {!isAuthenticated && (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <h2 className="text-lg font-semibold">Sign in to view your player profile</h2>
            <p className="mt-1 text-sm text-amber-50/80">
              Ratings, recent games, and achievements are available once your account is active.
            </p>
            <Button onClick={() => openAuthModal("login")} className="mt-4 rounded-2xl">
              Sign in
            </Button>
          </section>
        )}

        <ProductPanel strong className="overflow-hidden p-0">
          <div className="h-36 bg-[radial-gradient(circle_at_top_left,_rgba(102,153,205,0.32),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.01))]" />
          <div className="-mt-14 px-5 pb-6 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-[#11161e] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                    <AvatarImage src={profile?.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-primary text-3xl font-semibold text-primary-foreground">
                      {(profile?.user.username ?? user?.username ?? "CM").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="control-base absolute -bottom-1 -right-1 h-9 w-9 rounded-full text-white hover:bg-white/[0.12]">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-4xl text-white">{profile?.user.username ?? user?.username ?? "Guest"}</h2>
                    {(profile?.user.title ?? user?.title) ? (
                      <span className="rounded-full border border-primary/20 bg-primary/12 px-3 py-1 text-sm font-medium text-primary">
                        {profile?.user.title ?? user?.title}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {profile?.user.country ?? user?.country ?? "Country unavailable"} | Member since{" "}
                    {new Date(profile?.user.joinedAt ?? user?.joinedAt ?? Date.now()).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm text-slate-300">
                    {isAuthenticated
                      ? "Track performance, recent results, and earned milestones from one profile workspace."
                      : "Sign in to unlock your full player record."}
                  </p>
                </div>
              </div>

              <Button variant="outline" className="control-base h-12 rounded-xl text-white hover:bg-white/[0.08] hover:text-white">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </ProductPanel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {timeControls.map((control) => {
            const Icon = ratingIcons[control]
            const isSelected = selectedTimeControl === control
            const rating = selectedRatings[control] ?? profile?.user.rating ?? 0

            return (
              <button
                key={control}
                type="button"
                onClick={() => setSelectedTimeControl(control)}
                className={cn(
                  "rounded-2xl border p-5 text-left shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-all",
                  isSelected ? "border-primary/25 bg-primary/[0.10]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-slate-400">{control}</span>
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-slate-300")} />
                </div>
                <p className="mt-4 text-4xl font-semibold text-white">{rating}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Current rating</span>
                  <span className="text-slate-300 capitalize">{control}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Panel title="Performance snapshot" description="A quick read on form, volume, and your selected time control.">
            {isLoading ? (
              <EmptyInset>Loading profile...</EmptyInset>
            ) : (
              <div className="space-y-5">
                <InsetPanel className="p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Win rate</span>
                    <span className="font-semibold text-white">{winRate}%</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="bg-primary" style={{ width: `${winRate}%` }} />
                    <div className="bg-slate-500" style={{ width: `${drawRate}%` }} />
                    <div className="bg-red-400/80" style={{ width: `${lossRate}%` }} />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-medium">
                    <span className="text-primary">{aggregateStats.wins} wins</span>
                    <span className="text-slate-400">{aggregateStats.draws} draws</span>
                    <span className="text-red-300">{aggregateStats.losses} losses</span>
                  </div>
                </InsetPanel>

                <div className="space-y-3">
                  <MetricCard label="Total games" value={aggregateStats.gamesPlayed.toLocaleString()} />
                  <MetricCard label="Selected queue" value={<span className="capitalize text-primary">{selectedTimeControl}</span>} />
                  <MetricCard label="Primary rating" value={selectedRatings[selectedTimeControl] ?? profile?.user.rating ?? 0} />
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Recent activity" description="Recent games and achievements, arranged for quick review.">
            <Tabs defaultValue="games" className="gap-4">
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 lg:w-[320px]">
                <TabsTrigger value="games" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Recent Games</TabsTrigger>
                <TabsTrigger value="achievements" className="h-11 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="games">
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-3">
                    {recentGames.length === 0 ? (
                      <EmptyInset>No recent games yet.</EmptyInset>
                    ) : (
                      recentGames.map((game, idx) => {
                        const isFinished = game.status === "FINISHED"
                        const timestamp = game.updatedAt ?? game.createdAt
                        const meta = [
                          formatResult(game.result),
                          game.timeControl,
                          timestamp
                            ? new Date(timestamp).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" | ")

                        return (
                          <button
                            key={game.gameId}
                            type="button"
                            onClick={() => isFinished && router.push(`/analysis?game=${encodeURIComponent(game.gameId)}`)}
                            disabled={!isFinished}
                          >
                            <RecentGameCard
                              gameId={game.gameId}
                              statusLabel={game.status?.replaceAll("_", " ") ?? "Unknown"}
                              description={isFinished ? "Open game review" : "Analysis becomes available when the game is finished"}
                              meta={meta}
                              isFinished={isFinished}
                              index={idx}
                            />
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="achievements">
                <ScrollArea className="h-[420px] pr-2">
                  <div className="grid gap-3 md:grid-cols-2">
                    {(profile?.achievements ?? []).length === 0 ? (
                      <EmptyInset>No achievements yet.</EmptyInset>
                    ) : (
                      profile?.achievements.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          name={achievement.name}
                          description={achievement.description}
                          earned={achievement.earned}
                          earnedAt={achievement.earnedAt}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Panel>
        </div>
      </div>
    </AppLayout>
  )
}

