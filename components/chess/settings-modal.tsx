"use client"

import { Settings, Volume2, Bell, Palette, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { boardThemes, useAppSettings } from "./settings-context"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, updateSettings } = useAppSettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 animate-fade-in-scale">
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Settings</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Customize your chess experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          {/* Sound Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Volume2 className="h-4 w-4 text-slate-400" />
              Sound
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-effects" className="text-sm text-slate-400">
                  Move sounds
                </Label>
                <Switch
                  id="sound-effects"
                  checked={settings.moveSounds}
                  onCheckedChange={(checked) => updateSettings({ moveSounds: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-sound" className="text-sm text-slate-400">
                  Notification sounds
                </Label>
                <Switch
                  id="notifications-sound"
                  checked={settings.notificationSounds}
                  onCheckedChange={(checked) => updateSettings({ notificationSounds: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Volume</Label>
                <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="h-4 w-4 text-slate-400" />
              Notifications
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="game-alerts" className="text-sm text-slate-400">
                  Game alerts
                </Label>
                <Switch
                  id="game-alerts"
                  checked={settings.gameAlerts}
                  onCheckedChange={(checked) => updateSettings({ gameAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="chat-messages" className="text-sm text-slate-400">
                  Chat messages
                </Label>
                <Switch
                  id="chat-messages"
                  checked={settings.chatMessages}
                  onCheckedChange={(checked) => updateSettings({ chatMessages: checked })}
                />
              </div>
            </div>
          </div>

          {/* Board Theme */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="h-4 w-4 text-slate-400" />
              Board Theme
            </div>
            <div className="pl-6">
              <Select
                value={settings.boardTheme}
                onValueChange={(value) => updateSettings({ boardTheme: value as keyof typeof boardThemes })}
              >
                <SelectTrigger className="w-full bg-secondary border-white/5">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(boardThemes).map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-slate-400" />
              Default Time Control
            </div>
            <div className="pl-6">
              <Select
                value={settings.defaultTimeControl}
                onValueChange={(value) => updateSettings({ defaultTimeControl: value })}
              >
                <SelectTrigger className="w-full bg-secondary border-white/5">
                  <SelectValue placeholder="Select time control" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1+0">Bullet 1+0</SelectItem>
                  <SelectItem value="3+0">Blitz 3+0</SelectItem>
                  <SelectItem value="3+2">Blitz 3+2</SelectItem>
                  <SelectItem value="5+0">Blitz 5+0</SelectItem>
                  <SelectItem value="10+0">Rapid 10+0</SelectItem>
                  <SelectItem value="15+10">Rapid 15+10</SelectItem>
                  <SelectItem value="30+0">Classical 30+0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
