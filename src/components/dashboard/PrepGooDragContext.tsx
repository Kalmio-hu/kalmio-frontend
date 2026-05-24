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
import { createPortal } from 'react-dom'
import { useDraggable } from '@dnd-kit/core'
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
  /**
   * Source rectangle (viewport coords) of the dragged prep at drag-start.
   * Used as the "home" anchor for the goo stretch — the neck stretches from
   * here to the cursor. Captured from @dnd-kit's active.rect.current.initial.
   */
  homeRect: { left: number; top: number; width: number; height: number } | null
  /** Whether the dragged item is currently over a valid drop target. */
  isOverValidTarget: boolean
  /** Whether the dragged item is over an INVALID drop target (wrong meal). */
  isOverInvalidTarget: boolean
  /**
   * The meal ID of the drop target that is currently showing a rejection cue.
   * Set during drag-over of an invalid target; cleared on drag end.
   * KALMIO-336.
   */
  invalidTargetMealId: string | null
}

interface PrepGooContextValue {
  state: PrepGooState
  /** Begin a prep drag — captures home rect, sets the dragging prep task ID. */
  beginPrepDrag: (
    prepTaskId: string,
    homeRect: { left: number; top: number; width: number; height: number },
  ) => void
  /** Update pointer + drop-target state during a prep drag. */
  updatePrepDrag: (
    pointer: { x: number; y: number },
    overState: { isOverValid: boolean; isOverInvalid: boolean; invalidMealId: string | null },
  ) => void
  /** Clear all drag state. Idempotent. */
  endPrepDrag: () => void
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

// ── DraggablePrepBall ──────────────────────────────────────────────────────
//
// Draggable wrapper for an individual prep task chip inside PrepGooDragContext.
// Uses `useDraggable` wired to the nested DndContext (TouchSensor 250ms delay).
//
// The `isPressing` state covers the 250ms hold window where @dnd-kit's
// `isDragging` is still false. Native pointer events toggle `isPressing`
// so we can show a Material-style "pickup" cue (scale + shadow) immediately
// when the finger lands, before the sensor fires. KALMIO-327.
//
// Usage:
//   <DraggablePrepBall id={`prep-embed:${task.id}`}>
//     {({ isPressing, isDragging }) => <MyChip lifted={isPressing} ... />}
//   </DraggablePrepBall>

interface DraggablePrepBallProps {
  /** Drag ID — must start with 'prep-embed:' or 'prep-standalone:'. */
  id: string
  children: (bag: { isPressing: boolean; isDragging: boolean }) => React.ReactNode
}

export function DraggablePrepBall({ id, children }: DraggablePrepBallProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  const [isPressing, setIsPressing] = useState(false)

  // Forward dnd-kit's pointer handlers so PointerSensor is not clobbered by
  // last-write-wins JSX spread order. The sensor's onPointerDown must fire for
  // mouse drag activation; our local handler only tracks isPressing state.
  // KALMIO-327 reviewer fix.
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerDown?.(e)
    setIsPressing(true)
  }, [listeners])
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerUp?.(e)
    setIsPressing(false)
  }, [listeners])
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerCancel?.(e)
    setIsPressing(false)
  }, [listeners])
  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerLeave?.(e)
    setIsPressing(false)
  }, [listeners])

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      // touch-none prevents the browser's scroll-capture during the hold window.
      className="touch-none"
      style={{ userSelect: 'none' }}
    >
      {children({ isPressing: isPressing && !isDragging, isDragging })}
    </div>
  )
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
          <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

// ── PrepGooDragContext ─────────────────────────────────────────────────────

/**
 * Imperative API exposed via `apiRef` — DailyTimeline's drag handlers call
 * these from inside the (sole) timeline DndContext to drive the goo overlay
 * without this component owning its own DndContext.
 */
export interface PrepGooApi {
  beginPrepDrag: (
    prepTaskId: string,
    homeRect: { left: number; top: number; width: number; height: number },
  ) => void
  updatePrepDrag: (
    pointer: { x: number; y: number },
    overState: { isOverValid: boolean; isOverInvalid: boolean; invalidMealId: string | null },
  ) => void
  endPrepDrag: () => void
}

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
  /**
   * Map from prepTaskId → array of valid plannedMealIds this prep can attach to.
   * Used to validate drop targets during goo drag. KALMIO-336.
   */
  prepFeedsMap: Record<string, string[]>
  /**
   * Mutable ref the parent supplies; we populate `.current` with the imperative
   * goo API so the parent's existing DndContext handlers can drive the overlay.
   */
  apiRef?: React.MutableRefObject<PrepGooApi | null>
}

export function PrepGooDragContext({
  children,
  onEmbedPrepTask,
  onDetachPrepTask,
  prepFeedsMap,
  apiRef,
}: PrepGooDragContextProps) {
  const [state, setState] = useState<PrepGooState>({
    draggingPrepTaskId: null,
    dragPointer: null,
    homeRect: null,
    isOverValidTarget: false,
    isOverInvalidTarget: false,
    invalidTargetMealId: null,
  })

  // Imperative state setters driven from the parent DndContext's drag
  // handlers in DailyTimeline — this context owns the GOO VISUAL ONLY,
  // not the DnD itself. The reason: prep rows are wired into the
  // timeline's DndContext (for reschedule); we route prep-flavoured
  // drags into the goo overlay from inside that single context.
  const beginPrepDrag = useCallback((
    prepTaskId: string,
    homeRect: { left: number; top: number; width: number; height: number },
  ) => {
    setState({
      draggingPrepTaskId: prepTaskId,
      homeRect,
      dragPointer: null,
      isOverValidTarget: false,
      isOverInvalidTarget: false,
      invalidTargetMealId: null,
    })
    triggerHaptic()
  }, [])

  const updatePrepDrag = useCallback((
    pointer: { x: number; y: number },
    overState: { isOverValid: boolean; isOverInvalid: boolean; invalidMealId: string | null },
  ) => {
    setState(s => ({
      ...s,
      dragPointer: pointer,
      isOverValidTarget: overState.isOverValid,
      isOverInvalidTarget: overState.isOverInvalid,
      invalidTargetMealId: overState.invalidMealId,
    }))
  }, [])

  const endPrepDrag = useCallback(() => {
    setState({
      draggingPrepTaskId: null,
      homeRect: null,
      dragPointer: null,
      isOverValidTarget: false,
      isOverInvalidTarget: false,
      invalidTargetMealId: null,
    })
  }, [])

  // A11y keyboard callbacks — bypasses drag entirely. KALMIO-328.
  const handlePrepDetach = useCallback((prepTaskId: string) => {
    onDetachPrepTask(prepTaskId)
  }, [onDetachPrepTask])

  const handlePrepAttach = useCallback((prepTaskId: string) => {
    onEmbedPrepTask(prepTaskId)
  }, [onEmbedPrepTask])

  // prepFeedsMap is consumed by DailyTimeline's drag handlers (which call
  // updatePrepDrag with the resolved valid/invalid state) — reference here
  // is just to avoid the unused-prop warning while keeping the public API
  // stable for callers that still pass it.
  void prepFeedsMap

  // Expose the imperative API to the parent via the supplied ref. Updated on
  // every render so the latest callback identities are visible — they're all
  // useCallback'd so the identity is stable unless deps change.
  React.useEffect(() => {
    if (!apiRef) return
    apiRef.current = { beginPrepDrag, updatePrepDrag, endPrepDrag }
    return () => { apiRef.current = null }
  }, [apiRef, beginPrepDrag, updatePrepDrag, endPrepDrag])

  return (
    <PrepGooContext.Provider value={{
      state,
      beginPrepDrag,
      updatePrepDrag,
      endPrepDrag,
      onPrepDetach: handlePrepDetach,
      onPrepAttach: handlePrepAttach,
    }}>
      <GooFilterDefs />
      {children}
      {/* Goo stretch — source anchor + tether + cursor blob, rendered in a
          fixed-position portal so the SVG goo filter can merge all three
          blobs into one shape with a visible neck that snaps. */}
      {state.draggingPrepTaskId && state.homeRect && state.dragPointer && createPortal(
        <GooStretch
          home={state.homeRect}
          pointer={state.dragPointer}
          valid={state.isOverValidTarget}
          invalid={state.isOverInvalidTarget}
        />,
        document.body,
      )}
    </PrepGooContext.Provider>
  )
}

// ── GooStretch ─────────────────────────────────────────────────────────────

interface GooStretchProps {
  home: { left: number; top: number; width: number; height: number }
  pointer: { x: number; y: number }
  valid: boolean
  invalid: boolean
}

/**
 * Three blobs under the #goo filter:
 *   - source anchor at the dragged item's home rect
 *   - tether at the midpoint, scaling down with distance (the "neck")
 *   - cursor blob at the pointer
 *
 * The goo filter merges them into a single shape when close. Once the cursor
 * pulls past ~1.5× STICK_RING_RADIUS the tether fades and the cursor blob
 * separates — the visual "snap." Colour reflects validity:
 *   - teal (default / free)
 *   - purple-ish (snapping to a valid meal)
 *   - red (over an invalid meal — wrong feeds set)
 */
function GooStretch({ home, pointer, valid, invalid }: GooStretchProps) {
  const homeCx = home.left + home.width / 2
  const homeCy = home.top + home.height / 2
  const dist = Math.hypot(pointer.x - homeCx, pointer.y - homeCy)
  const stretch = Math.min(dist / STICK_RING_RADIUS_PX, 1.6)
  const tethered = dist < STICK_RING_RADIUS_PX * 1.5

  // Colour reflects the drop validity. Teal is the resting/free state.
  // Purple-ish is the demo's "snapping" colour (a29bfe) — communicates pull-in.
  // Red is the rejection cue for an invalid drop (wrong meal).
  const color = invalid ? '#fca5a5' : valid ? '#a29bfe' : '#14b8a6'

  // Tether is anchored at the midpoint between home and pointer.
  const tx = (homeCx + pointer.x) / 2
  const ty = (homeCy + pointer.y) / 2

  // Source anchor sized roughly to the home rect — looks like the row "bulges"
  // out toward the cursor. Capped so very tall rows don't dominate.
  const anchorW = Math.min(home.width, 140)
  const anchorH = Math.min(home.height, 44)

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 60 }}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ filter: 'url(#goo)' }}>
        {/* Source anchor — bulge at the home position. */}
        <div
          className="absolute rounded-3xl"
          style={{
            left: homeCx - anchorW / 2,
            top: homeCy - anchorH / 2,
            width: anchorW,
            height: anchorH,
            background: color,
            opacity: 0.95,
            transition: 'background 0.2s',
          }}
        />
        {/* Tether blob — between home and cursor, scaling down with distance. */}
        {tethered && (
          <div
            className="absolute rounded-full"
            style={{
              left: tx - 26,
              top: ty - 26,
              width: 52,
              height: 52,
              background: color,
              opacity: Math.max(1 - stretch * 0.8, 0),
              transform: `scale(${Math.max(1 - stretch * 0.45, 0.25)})`,
              transition: 'background 0.2s',
            }}
          />
        )}
        {/* Cursor blob — follows the pointer. */}
        <div
          className="absolute rounded-full"
          style={{
            left: pointer.x - 24,
            top: pointer.y - 24,
            width: 48,
            height: 48,
            background: color,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            transition: 'background 0.2s',
          }}
        />
      </div>
    </div>
  )
}
