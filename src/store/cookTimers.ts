/**
 * cookTimers — Zustand store for in-step kitchen timers (KALMIO-408).
 *
 * Each timer is keyed by a unique id (stepIdx + recipeId combo).
 * Timers survive in-app navigation because the store lives outside any
 * component tree.
 *
 * Boundary logic:
 *   elapsedSeconds < minSeconds        → "cooking" phase  (warm gray)
 *   minSeconds ≤ elapsed ≤ maxSeconds  → "ready" zone     (olive green)
 *   elapsed > maxSeconds               → "past" zone      (terracotta red)
 *
 * Alerts:
 *   At minSeconds: soft chime + trigger soft alert flag
 *   At maxSeconds: hard chime (two tones) + trigger hard alert flag
 */

import { create } from 'zustand'
import type { TimerWindow } from '@/lib/parseTimerWindow'

// ── Audio helpers ────────────────────────────────────────────────────────────

function playChime(frequency: number, duration: number, volume = 0.4): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)

    osc.onended = () => void ctx.close()
  } catch {
    // AudioContext not available (e.g. in test env) — silently no-op.
  }
}

/** Single soft chime — used at the min boundary. */
export function playSoftChime(): void {
  playChime(880, 0.8, 0.35)
}

/** Two-tone hard chime — used at the max boundary. */
export function playHardChime(): void {
  playChime(660, 0.5, 0.45)
  setTimeout(() => playChime(440, 0.7, 0.45), 300)
}

// ── Notification helper ──────────────────────────────────────────────────────

/**
 * Fires a native Notification when the document is hidden and permission is
 * already granted. Does NOT prompt — CookMode asks for permission separately.
 */
export function maybeNotify(title: string, body: string): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (!document.hidden) return
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  } catch {
    // Silently no-op if Notification constructor fails (e.g. SW not active).
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type TimerPhase = 'cooking' | 'ready' | 'past'

export interface CookTimer {
  id: string
  recipeId: string
  stepIdx: number
  stepLabel: string          // Short label for the strip header
  window: TimerWindow
  elapsedSeconds: number
  running: boolean
  /** Unix ms timestamp of when the current running interval started */
  startedAt: number | null
  /** Whether the soft alert (min) has already fired */
  softFired: boolean
  /** Whether the hard alert (max) has already fired */
  hardFired: boolean
  /** Momentary visual pulse: 'soft' | 'hard' | null */
  pulse: 'soft' | 'hard' | null
}

export type TimerPhaseOf = (timer: CookTimer) => TimerPhase

export function timerPhase(timer: CookTimer): TimerPhase {
  if (timer.elapsedSeconds < timer.window.minSeconds) return 'cooking'
  if (timer.elapsedSeconds <= timer.window.maxSeconds) return 'ready'
  return 'past'
}

// ── Store ────────────────────────────────────────────────────────────────────

interface CookTimersState {
  timers: Record<string, CookTimer>
  /** Tick intervals — keyed by timer id, value is setInterval handle */
  _intervals: Record<string, ReturnType<typeof setInterval>>
  /** Callbacks to fire alerts (set once by CookMode) */
  _onSoftAlert: ((timer: CookTimer) => void) | null
  _onHardAlert: ((timer: CookTimer) => void) | null

  startTimer: (timer: Omit<CookTimer, 'elapsedSeconds' | 'running' | 'startedAt' | 'softFired' | 'hardFired' | 'pulse'>) => void
  pauseTimer: (id: string) => void
  resumeTimer: (id: string) => void
  resetTimer: (id: string) => void
  removeTimer: (id: string) => void
  clearPulse: (id: string) => void
  registerAlertCallbacks: (
    onSoft: (timer: CookTimer) => void,
    onHard: (timer: CookTimer) => void,
  ) => void
}

export const useCookTimersStore = create<CookTimersState>((set, get) => ({
  timers: {},
  _intervals: {},
  _onSoftAlert: null,
  _onHardAlert: null,

  registerAlertCallbacks: (onSoft, onHard) => {
    set({ _onSoftAlert: onSoft, _onHardAlert: onHard })
  },

  startTimer: (timerInit) => {
    const { timers } = get()

    // If timer already exists just resume it
    if (timers[timerInit.id]) {
      get().resumeTimer(timerInit.id)
      return
    }

    const timer: CookTimer = {
      ...timerInit,
      elapsedSeconds: 0,
      running: true,
      startedAt: Date.now(),
      softFired: false,
      hardFired: false,
      pulse: null,
    }

    set(s => ({ timers: { ...s.timers, [timer.id]: timer } }))

    const intervalHandle = setInterval(() => {
      const state = get()
      const t = state.timers[timer.id]
      if (!t || !t.running) return

      const newElapsed = t.elapsedSeconds + 1
      let pulse = t.pulse
      let softFired = t.softFired
      let hardFired = t.hardFired

      // Soft alert at min boundary
      if (!softFired && newElapsed >= t.window.minSeconds) {
        softFired = true
        pulse = 'soft'
        playSoftChime()
        state._onSoftAlert?.({ ...t, elapsedSeconds: newElapsed, softFired, pulse })
      }

      // Hard alert at max boundary
      if (!hardFired && newElapsed >= t.window.maxSeconds) {
        hardFired = true
        pulse = 'hard'
        playHardChime()
        state._onHardAlert?.({ ...t, elapsedSeconds: newElapsed, hardFired, pulse })
      }

      set(s => ({
        timers: {
          ...s.timers,
          [timer.id]: {
            ...s.timers[timer.id],
            elapsedSeconds: newElapsed,
            softFired,
            hardFired,
            pulse,
          },
        },
      }))
    }, 1000)

    set(s => ({ _intervals: { ...s._intervals, [timer.id]: intervalHandle } }))
  },

  pauseTimer: (id) => {
    const intervals = get()._intervals
    if (intervals[id]) {
      clearInterval(intervals[id])
      const next = { ...intervals }
      delete next[id]
      set(s => ({
        timers: { ...s.timers, [id]: { ...s.timers[id], running: false, startedAt: null } },
        _intervals: next,
      }))
    }
  },

  resumeTimer: (id) => {
    const { timers } = get()
    const t = timers[id]
    if (!t || t.running) return

    set(s => ({
      timers: { ...s.timers, [id]: { ...s.timers[id], running: true, startedAt: Date.now() } },
    }))

    const intervalHandle = setInterval(() => {
      const state = get()
      const timer = state.timers[id]
      if (!timer || !timer.running) return

      const newElapsed = timer.elapsedSeconds + 1
      let pulse = timer.pulse
      let softFired = timer.softFired
      let hardFired = timer.hardFired

      if (!softFired && newElapsed >= timer.window.minSeconds) {
        softFired = true
        pulse = 'soft'
        playSoftChime()
        state._onSoftAlert?.({ ...timer, elapsedSeconds: newElapsed, softFired, pulse })
      }

      if (!hardFired && newElapsed >= timer.window.maxSeconds) {
        hardFired = true
        pulse = 'hard'
        playHardChime()
        state._onHardAlert?.({ ...timer, elapsedSeconds: newElapsed, hardFired, pulse })
      }

      set(s => ({
        timers: {
          ...s.timers,
          [id]: { ...s.timers[id], elapsedSeconds: newElapsed, softFired, hardFired, pulse },
        },
      }))
    }, 1000)

    set(s => ({ _intervals: { ...s._intervals, [id]: intervalHandle } }))
  },

  resetTimer: (id) => {
    const intervals = get()._intervals
    const resetState = {
      elapsedSeconds: 0,
      running: false,
      startedAt: null,
      softFired: false,
      hardFired: false,
      pulse: null,
    } as const
    if (intervals[id]) {
      clearInterval(intervals[id])
      const next = { ...intervals }
      delete next[id]
      set(s => ({
        timers: { ...s.timers, [id]: { ...s.timers[id], ...resetState } },
        _intervals: next,
      }))
    } else {
      set(s => ({
        timers: { ...s.timers, [id]: { ...s.timers[id], ...resetState } },
      }))
    }
  },

  removeTimer: (id) => {
    const intervals = get()._intervals
    if (intervals[id]) clearInterval(intervals[id])
    const nextIntervals = { ...intervals }
    delete nextIntervals[id]
    set(s => {
      const nextTimers = { ...s.timers }
      delete nextTimers[id]
      return { timers: nextTimers, _intervals: nextIntervals }
    })
  },

  clearPulse: (id) => {
    set(s => ({
      timers: { ...s.timers, [id]: { ...s.timers[id], pulse: null } },
    }))
  },
}))
