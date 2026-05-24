/* eslint-disable react-refresh/only-export-components */
/**
 * PrepGooDragContext — KALMIO-325 + KALMIO-327
 *
 * Provides:
 *  - An @dnd-kit DndContext wrapping embedded prep slots and standalone prep balls.
 *  - An SVG <defs> block with the #goo filter (feGaussianBlur + feColorMatrix) so
 *    it can be applied to a parent container element to achieve the "sticky goo"
 *    stretching-neck effect between the dragged item and its origin.
 *  - Sensor configuration:
 *      Mouse/pointer: immediate drag on pointer-down + move (distance 4px).
 *      Touch: long-press 250ms + move (tolerance 5px). KALMIO-327.
 *  - Callbacks `onPrepDetach` and `onPrepAttach` propagated through context so
 *    EmbeddedPrepChip and DailyTimeline can mutate executeImmediatelyBefore.
 *
 * Architecture notes:
 *  - The goo filter is NOT applied to card text — only to the blobs layer beneath.
 *    This keeps text crisp regardless of the blur. The two-layer pattern matches
 *    the classic CSS goo demo: a filtered container for circular blobs, a separate
 *    un-filtered container for labels.
 *  - The DndContext here is separate from the existing DailyTimeline DndContext
 *    (which handles timeline card reordering). We use a nested DndContext per
 *    @dnd-kit docs — each handles a distinct interaction domain.
 *  - 60fps budget: the filter is applied via CSS class on a `will-change: filter`
 *    container. Blob positions are updated with `transform` (GPU composited).
 */

import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
} from '@dnd-kit/core'
import { triggerHaptic } from '@/lib/haptics'

// ── Constants ──────────────────────────────────────────────────────────────

/**
 * Radius in pixels of the dashed "stick" ring around a meal card.
 * If the user releases within this radius of the card origin, the prep slot
 * snaps back as embedded; outside this radius it becomes standalone.
 */
export const STICK_RING_RADIUS_PX = 90

/**
 * Touch sensor delay for long-press initiation (KALMIO-327).
 * Configurable here rather than hardcoded at call sites.
 */
export const PREP_TOUCH_DELAY_MS = 250

/**
 * Touch tolerance — how many pixels the finger may drift during the hold
 * window before the gesture is cancelled (important: keep ≥5px to allow
 * natural tremor, but small enough to not eat scroll gestures).
 */
export const PREP_TOUCH_TOLERANCE_PX = 5

// ── Context ────────────────────────────────────────────────────────────────

export interface PrepGooState {
  /** ID of the prep task currently being dragged, or null. */
  draggingPrepTaskId: string | null
  /** Current drag pointer position relative to viewport. */
  dragPointer: { x: number; y: number } | null
  /** Whether the dragged item is currently over a valid drop target. */
  isOverValidTarget: boolean
  /** Whether the dragged item is over an INVALID drop target (wrong meal). */
  isOverInvalidTarget: boolean
}

interface PrepGooContextValue {
  state: PrepGooState
  /** Call when the user activates the keyboard Detach button. */
  onPrepDetach: (prepTaskId: string) => void
  /** Call when the user activates the keyboard Attach button. */
  onPrepAttach: (prepTaskId: string) => void
}

const PrepGooContext = createContext<PrepGooContextValue | null>(null)

export function usePrepGoo(): PrepGooContextValue {
  const ctx = useContext(PrepGooContext)
  if (!ctx) throw new Error('usePrepGoo must be used within PrepGooDragContext')
  return ctx
}

// ── SVG Goo filter ─────────────────────────────────────────────────────────

/**
 * Renders the #goo SVG filter definition.
 * Mount this once high in the tree (PrepGooDragContext does it).
 * Apply via CSS: `filter: url(#goo)` on the blobs container.
 *
 * The stdDeviation of 8 + threshold of 18 is tuned to produce a
 * visible neck that snaps cleanly. Adjust if the connection looks
 * too thick or thin after visual QA.
 */
export function GooFilterDefs() {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden
    >
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

// ── PrepGooDragContext ─────────────────────────────────────────────────────

interface PrepGooDragContextProps {
  children: React.ReactNode
  /**
   * Called when a drag ends with the prep slot released over a valid meal ring.
   * The parent (DailyTimeline) patches executeImmediatelyBefore = true on the server.
   * mealId is provided for UI feedback but the server call only needs prepTaskId.
   */
  onEmbedPrepTask: (prepTaskId: string) => void
  /**
   * Called when a drag ends with the prep slot released outside all meal rings.
   * The parent patches executeImmediatelyBefore = false to make it standalone.
   */
  onDetachPrepTask: (prepTaskId: string) => void
}

export function PrepGooDragContext({
  children,
  onEmbedPrepTask,
  onDetachPrepTask,
}: PrepGooDragContextProps) {
  const [state, setState] = useState<PrepGooState>({
    draggingPrepTaskId: null,
    dragPointer: null,
    isOverValidTarget: false,
    isOverInvalidTarget: false,
  })

  // Pointer sensor: immediate on mouse, distance=4 prevents accidental drags.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 4 },
  })

  // Touch sensor: 250ms long-press (KALMIO-327). toleranceDistance prevents
  // the drag cancelling on the micro-movements that happen during a hold.
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: PREP_TOUCH_DELAY_MS,
      tolerance: PREP_TOUCH_TOLERANCE_PX,
    },
  })

  const sensors = useSensors(pointerSensor, touchSensor)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    // Only handle IDs prefixed with 'prep-embed:' or 'prep-standalone:'
    if (!id.startsWith('prep-embed:') && !id.startsWith('prep-standalone:')) return

    const prepTaskId = id.split(':')[1] ?? id
    setState(s => ({ ...s, draggingPrepTaskId: prepTaskId }))
    triggerHaptic()
  }, [])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const id = String(event.active.id)
    if (!id.startsWith('prep-embed:') && !id.startsWith('prep-standalone:')) return

    // Track pointer position for the goo blob overlay.
    const coords = event.activatorEvent instanceof PointerEvent || event.activatorEvent instanceof TouchEvent
      ? (() => {
          if (event.activatorEvent instanceof PointerEvent) {
            return { x: event.activatorEvent.clientX + event.delta.x, y: event.activatorEvent.clientY + event.delta.y }
          }
          const touch = (event.activatorEvent as TouchEvent).changedTouches[0]
          return touch
            ? { x: touch.clientX + event.delta.x, y: touch.clientY + event.delta.y }
            : null
        })()
      : null

    setState(s => ({ ...s, dragPointer: coords }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const id = String(event.active.id)
    if (!id.startsWith('prep-embed:') && !id.startsWith('prep-standalone:')) {
      return
    }

    const prepTaskId = id.split(':')[1] ?? id
    const overId = event.over ? String(event.over.id) : null

    if (overId && overId.startsWith('meal-drop:')) {
      onEmbedPrepTask(prepTaskId)
    } else {
      // Released outside any valid meal ring — make standalone.
      onDetachPrepTask(prepTaskId)
    }

    setState({
      draggingPrepTaskId: null,
      dragPointer: null,
      isOverValidTarget: false,
      isOverInvalidTarget: false,
    })
  }, [onEmbedPrepTask, onDetachPrepTask])

  // A11y keyboard callbacks — bypasses drag entirely. KALMIO-328.
  const handlePrepDetach = useCallback((prepTaskId: string) => {
    onDetachPrepTask(prepTaskId)
  }, [onDetachPrepTask])

  const handlePrepAttach = useCallback((prepTaskId: string) => {
    onEmbedPrepTask(prepTaskId)
  }, [onEmbedPrepTask])

  return (
    <PrepGooContext.Provider value={{ state, onPrepDetach: handlePrepDetach, onPrepAttach: handlePrepAttach }}>
      <GooFilterDefs />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {children}
        {/* DragOverlay renders the dragged chip at pointer position, above all content. */}
        <DragOverlay dropAnimation={null}>
          {state.draggingPrepTaskId ? (
            <div
              className="w-7 h-7 rounded-full bg-teal-500 shadow-lg opacity-90"
              style={{ filter: 'url(#goo)' }}
              aria-hidden
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </PrepGooContext.Provider>
  )
}
