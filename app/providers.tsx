"use client"

import { AuthProvider } from "@/components/chess/auth-context"
import { SettingsProvider } from "@/components/chess/settings-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <SettingsProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
