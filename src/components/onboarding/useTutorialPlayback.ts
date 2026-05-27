/**
 * useTutorialPlayback — shared playback engine for the onboarding mini tutorials
 * (MiniTutorialPlanner / MiniTutorialGrooming / MiniTutorialReplanDiff).
 *
 * Behavior:
 *   • Auto-advances frame by frame on the configured interval.
 *   • The first user interaction (Back / Next / dot jump / explicit Pause)
 *     puts playback into a paused state. Auto-advance resumes only when the
 *     user clicks Play.
 *   • Calling `next` while on the last frame fires `onComplete` (the tutorial
 *     is treated as finished).
 *   • Honours prefers-reduced-motion: on first render in that environment,
 *     auto-play is OFF so a user with motion sensitivities controls pacing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface UseTutorialPlaybackOptions {
  totalFrames: number
  frameDurationMs: number
  onComplete: () => void
}

export interface TutorialPlayback {
  frame: number
  isPlaying: boolean
  isFirstFrame: boolean
  isLastFrame: boolean
  next: () => void
  prev: () => void
  jumpTo: (index: number) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useTutorialPlayback({
  totalFrames,
  frameDurationMs,
  onComplete,
}: UseTutorialPlaybackOptions): TutorialPlayback {
  const [frame, setFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(() => !prefersReducedMotion())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lastIndex = totalFrames - 1
  const prevFrameRef = useRef<number>(0)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const next = useCallback(() => {
    setFrame(prev => {
      if (prev >= lastIndex) return prev
      return prev + 1
    })
  }, [lastIndex])

  const prev = useCallback(() => {
    setIsPlaying(false)
    setFrame(p => Math.max(0, p - 1))
  }, [])

  const jumpTo = useCallback((index: number) => {
    setIsPlaying(false)
    const clamped = Math.max(0, Math.min(lastIndex, index))
    setFrame(clamped)
  }, [lastIndex])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const togglePlay = useCallback(() => setIsPlaying(p => !p), [])

  // Wrapper used by the auto-advance timer and by the Next button alike. The
  // Next button also pauses playback (manual stepping behavior).
  const advanceFromTimer = useCallback(() => {
    setFrame(prev => {
      if (prev >= lastIndex) return prev
      return prev + 1
    })
  }, [lastIndex])

  const manualNext = useCallback(() => {
    setIsPlaying(false)
    next()
  }, [next])

  // Fire onComplete when frame crosses from < lastIndex to lastIndex (after render).
  useEffect(() => {
    if (frame >= lastIndex && prevFrameRef.current < lastIndex) {
      onComplete()
    }
    prevFrameRef.current = frame
  }, [frame, lastIndex, onComplete])

  useEffect(() => {
    clearTimer()
    if (!isPlaying) return
    timerRef.current = setTimeout(advanceFromTimer, frameDurationMs)
    return clearTimer
  }, [frame, isPlaying, frameDurationMs, advanceFromTimer])

  return useMemo<TutorialPlayback>(() => ({
    frame,
    isPlaying,
    isFirstFrame: frame === 0,
    isLastFrame: frame === lastIndex,
    next: manualNext,
    prev,
    jumpTo,
    play,
    pause,
    togglePlay,
  }), [frame, isPlaying, lastIndex, manualNext, prev, jumpTo, play, pause, togglePlay])
}
