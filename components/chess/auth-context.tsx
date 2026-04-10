"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import {
  AppSettingsResponse,
  AuthResponse,
  BackendError,
  UserSummary,
  authApi,
  getErrorMessage,
} from "@/lib/backend"

type AuthMode = "login" | "register"

interface AuthActionResult {
  success: boolean
  message: string
  details?: Record<string, string>
}

interface AuthContextValue {
  user: UserSummary | null
  token: string | null
  settingsSnapshot: AppSettingsResponse | null
  authModalOpen: boolean
  authMode: AuthMode
  isAuthenticated: boolean
  isBootstrapping: boolean
  isSubmitting: boolean
  openAuthModal: (mode?: AuthMode) => void
  closeAuthModal: () => void
  login: (email: string, password: string) => Promise<AuthActionResult>
  register: (input: { username: string; email: string; password: string }) => Promise<AuthActionResult>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  setSettingsSnapshot: (settings: AppSettingsResponse | null) => void
}

const TOKEN_KEY = "chess-app-token"

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [settingsSnapshot, setSettingsSnapshot] = useState<AppSettingsResponse | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const persistAuth = useCallback((response: AuthResponse) => {
    setUser(response.user)
    setToken(response.token)
    setSettingsSnapshot(response.settings)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, response.token)
    }
  }, [])

  const clearAuth = useCallback(() => {
    setUser(null)
    setToken(null)
    setSettingsSnapshot(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const storedToken = readStoredToken()
    if (!storedToken) {
      clearAuth()
      setIsBootstrapping(false)
      return
    }

    try {
      const response = await authApi.me(storedToken)
      persistAuth(response)
    } catch {
      clearAuth()
    } finally {
      setIsBootstrapping(false)
    }
  }, [clearAuth, persistAuth])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const openAuthModal = (mode: AuthMode = "login") => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  const login = async (email: string, password: string) => {
    setIsSubmitting(true)
    try {
      const response = await authApi.login({ email: email.trim(), password })
      persistAuth(response)
      setAuthModalOpen(false)
      return { success: true, message: `Welcome back, ${response.user.username}.` }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Unable to log in."),
        details: error instanceof BackendError ? error.details : undefined,
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const register = async (input: { username: string; email: string; password: string }) => {
    setIsSubmitting(true)
    try {
      const response = await authApi.register({
        username: input.username.trim(),
        email: input.email.trim(),
        password: input.password,
      })
      persistAuth(response)
      setAuthModalOpen(false)
      return { success: true, message: `Account created for ${response.user.username}.` }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Unable to create account."),
        details: error instanceof BackendError ? error.details : undefined,
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Backend logout is currently advisory; client token removal is what matters.
    } finally {
      clearAuth()
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      settingsSnapshot,
      authModalOpen,
      authMode,
      isAuthenticated: Boolean(user && token),
      isBootstrapping,
      isSubmitting,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      logout,
      refreshSession,
      setSettingsSnapshot,
    }),
    [
      user,
      token,
      settingsSnapshot,
      authModalOpen,
      authMode,
      isBootstrapping,
      isSubmitting,
      refreshSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
