"use client"

import { useState } from "react"
import { LockKeyhole, Mail, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAuth } from "./auth-context"

export function AuthModal() {
  const { authModalOpen, closeAuthModal, authMode, openAuthModal, login, register, isSubmitting } = useAuth()
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" })

  const handleLogin = async () => {
    const result = await login(loginForm.email, loginForm.password)
    if (result.success) {
      toast.success(result.message)
      setLoginForm({ email: "", password: "" })
    } else {
      toast.error(result.message)
    }
  }

  const handleRegister = async () => {
    const result = await register(registerForm)
    if (result.success) {
      toast.success(result.message)
      setRegisterForm({ username: "", email: "", password: "" })
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="border-white/10 bg-[#0f1719]/95 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-white">Account access</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Sign in or create an account to unlock profile, bot setup, and saved preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMode} onValueChange={(value) => openAuthModal(value as "login" | "register")} className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            <TabsTrigger value="login" className="h-11 rounded-xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="h-11 rounded-xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Register
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {authMode === "login" ? (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <Mail className="h-4 w-4 text-slate-500" />
                Email
              </span>
              <Input
                value={loginForm.email}
                onChange={(e) => setLoginForm((current) => ({ ...current, email: e.target.value }))}
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                placeholder="player@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                Password
              </span>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((current) => ({ ...current, password: e.target.value }))}
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                placeholder="Enter your password"
              />
            </label>
            <Button className="h-12 w-full rounded-2xl" onClick={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <UserRound className="h-4 w-4 text-slate-500" />
                Username
              </span>
              <Input
                value={registerForm.username}
                onChange={(e) => setRegisterForm((current) => ({ ...current, username: e.target.value }))}
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                placeholder="TacticalTiger"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <Mail className="h-4 w-4 text-slate-500" />
                Email
              </span>
              <Input
                value={registerForm.email}
                onChange={(e) => setRegisterForm((current) => ({ ...current, email: e.target.value }))}
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                placeholder="player@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                Password
              </span>
              <Input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((current) => ({ ...current, password: e.target.value }))}
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                placeholder="Create a password"
              />
            </label>
            <Button className="h-12 w-full rounded-2xl" onClick={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
