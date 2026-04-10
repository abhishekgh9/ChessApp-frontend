"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { AppSettingsResponse, getErrorMessage, settingsApi } from "@/lib/backend"

import { useAuth } from "./auth-context"

export type BoardThemeKey = "classic" | "tournament" | "ocean" | "midnight" | "slate"

export interface AppSettings extends Omit<AppSettingsResponse, "boardTheme"> {
  boardTheme: BoardThemeKey
}

interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  isSaving: boolean
}

export const boardThemes: Record<BoardThemeKey, { label: string; light: string; dark: string }> = {
  classic: { label: "Classic Wood", light: "#E8D9B5", dark: "#6B4E34" },
  tournament: { label: "Tournament Green", light: "#F0E7D8", dark: "#5E7A45" },
  ocean: { label: "Ocean Blue", light: "#DCEAF7", dark: "#4A6D8C" },
  midnight: { label: "Midnight Glass", light: "#B9C3D8", dark: "#334155" },
  slate: { label: "Slate Minimal", light: "#D9DDE4", dark: "#6B7280" },
}

export const defaultSettings: AppSettings = {
  moveSounds: true,
  notificationSounds: true,
  gameAlerts: true,
  chatMessages: true,
  boardTheme: "classic",
  defaultTimeControl: "10+0",
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function parseTimeControlToSeconds(timeControl: string) {
  const [minutes] = timeControl.split("+")
  return Number(minutes) * 60
}

function normalizeSettings(settings?: AppSettingsResponse | null): AppSettings {
  const nextTheme = settings?.boardTheme
  const boardTheme = nextTheme && nextTheme in boardThemes ? (nextTheme as BoardThemeKey) : defaultSettings.boardTheme

  return {
    moveSounds: settings?.moveSounds ?? defaultSettings.moveSounds,
    notificationSounds: settings?.notificationSounds ?? defaultSettings.notificationSounds,
    gameAlerts: settings?.gameAlerts ?? defaultSettings.gameAlerts,
    chatMessages: settings?.chatMessages ?? defaultSettings.chatMessages,
    boardTheme,
    defaultTimeControl: settings?.defaultTimeControl ?? defaultSettings.defaultTimeControl,
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, settingsSnapshot, setSettingsSnapshot } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(normalizeSettings(settingsSnapshot))
  const [isSaving, setIsSaving] = useState(false)

  // Keep a ref to the latest snapshot so the fetch effect can read it
  // without having it in the dependency array (which caused the infinite loop).
  const snapshotRef = useRef(settingsSnapshot)
  snapshotRef.current = settingsSnapshot

  const stableSetSnapshot = useCallback(
    (s: AppSettingsResponse | null) => setSettingsSnapshot(s),
    [setSettingsSnapshot],
  )

  useEffect(() => {
    setSettings(normalizeSettings(settingsSnapshot))
  }, [settingsSnapshot])

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setSettings(normalizeSettings(snapshotRef.current))
      return
    }

    let cancelled = false

    void settingsApi
      .get(token)
      .then((response) => {
        if (cancelled) return
        setSettings(normalizeSettings(response))
        stableSetSnapshot(response)
      })
      .catch(() => {
        if (cancelled) return
        setSettings(normalizeSettings(snapshotRef.current))
      })

    return () => {
      cancelled = true
    }
  }, [token, isAuthenticated, stableSetSnapshot])

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const optimistic = { ...settings, ...patch }
    setSettings(optimistic)

    if (!token || !isAuthenticated) {
      setSettingsSnapshot(optimistic)
      return
    }

    setIsSaving(true)
    try {
      const saved = await settingsApi.patch(token, patch)
      setSettings(normalizeSettings(saved))
      setSettingsSnapshot(saved)
    } catch (error) {
      setSettings(normalizeSettings(settingsSnapshot))
      toast.error(getErrorMessage(error, "Unable to save settings."))
    } finally {
      setIsSaving(false)
    }
  }

  const value = useMemo(() => ({ settings, updateSettings, isSaving }), [settings, isSaving])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useAppSettings must be used within a SettingsProvider")
  }
  return context
}
