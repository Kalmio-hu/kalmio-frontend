/**
 * PlantingScene — KALMIO-155
 *
 * Animated walnut-planting scene that advances step by step across onboarding
 * screens (steps 0–10, driven by the `step` prop). Progress is cumulative: each
 * advance animates *in* and stays visible, so the scene builds up as the user
 * moves through the questionnaire.
 *
 * Each scene layer renders one of the hand-painted PNGs delivered under
 * KALMIO-128 / KALMIO-129 from `src/assets/diofa/`. The framer-motion enter
 * animations (fadeUp, scaleIn, dropIn, etc.) wrap the image; shape-level
 * animation (water drops falling, soil mound growing) was specific to the
 * inline-SVG placeholders and is intentionally dropped now that each layer
 * is a single composed PNG.
 *
 * Step → scene mapping (from gamification-progression.md §4.1):
 *   0  Welcome screen        → Hand visible above soil, holding the walnut
 *   1  Household size        → A hole is dug; the hand lowers
 *   2  Activity + calories   → The walnut is placed in the hole
 *   3  Dietary restrictions  → First handful of soil covers the walnut
 *   4  Shopping cadence      → Soil mound formed and patted down
 *   5  Forbidden ingredients → A small wooden name stake placed
 *   6  Taste swipe (each)    → Swipe micro-step — stone/leaf/soil moistens
 *   7  Loading: plan gen     → Watering can tips; first drops fall
 *   8  First plan reveal     → Soil is dark and moist; seed fully planted
 *   9  User accepts plan     → Mag stage complete; transition queued
 *  10  First action          → Sprout — Csemete: two cotyledon leaves above ground
 *
 * Usage:
 *   <PlantingScene step={onboardingStep} className="..." />
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import soilBedPng from '@/assets/diofa/soil-bed.png'
import handWithWalnutPng from '@/assets/diofa/hand-with-walnut.png'
import holePng from '@/assets/diofa/hole.png'
import walnutInHolePng from '@/assets/diofa/walnut-in-hole.png'
import soilMoundPng from '@/assets/diofa/soil-mound.png'
import nameStakePng from '@/assets/diofa/name-stake.png'
import swipeDetailsPng from '@/assets/diofa/swipe-details.png'
import wateringCanPng from '@/assets/diofa/watering-can.png'
import sproutCsemetePng from '@/assets/diofa/sprout-csemete.png'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlantingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

interface PlantingSceneProps {
  /** Current onboarding step (0..10). Prop should only ever increase. */
  step: PlantingStep
  className?: string
  /** Reduced-motion: caller may set this to suppress motion animations.
   *  If omitted the component respects prefers-reduced-motion via CSS. */
  reducedMotion?: boolean
}

// ---------------------------------------------------------------------------
// Animation variants — shared spring config
// ---------------------------------------------------------------------------

const SPRING = { type: 'spring', stiffness: 220, damping: 22 } as const

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}

const EASE_OUT: Easing = 'easeOut'

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
}

const dropIn = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING, delay: 0.1 } },
}

// ---------------------------------------------------------------------------
// Sub-components — each represents one scene element that appears at a step
// ---------------------------------------------------------------------------

/** The soil bed — always visible across the bottom of the scene */
function SoilBed() {
  return (
    <image
      href={soilBedPng}
      x="0" y="155" width="360" height="90"
      preserveAspectRatio="xMidYMid slice"
      data-asset="diofa/soil-bed.png"
      aria-hidden="true"
    />
  )
}

/** Hand holding the walnut — visible at step 0, lowers at step 1, exits at step 2 */
function Hand({ step }: { step: PlantingStep }) {
  const y = step === 0 ? 80 : step === 1 ? 120 : 160
  const opacity = step >= 2 ? 0 : 1

  return (
    <motion.image
      href={handWithWalnutPng}
      x="135" width="90" height="120"
      preserveAspectRatio="xMidYMid meet"
      initial={false}
      animate={{ y, opacity }}
      transition={{ ...SPRING }}
      style={{ y: -40 }}
      data-asset="diofa/hand-with-walnut.png"
      aria-hidden="true"
    />
  )
}

/** Hole dug in soil — appears at step 1 */
function Hole({ step }: { step: PlantingStep }) {
  if (step < 1) return null
  return (
    <motion.image
      href={holePng}
      x="145" y="148" width="70" height="40"
      preserveAspectRatio="xMidYMid meet"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      data-asset="diofa/hole.png"
      aria-hidden="true"
    />
  )
}

/** Walnut placed in hole — appears at step 2, buried at step 3 */
function WalnutInHole({ step }: { step: PlantingStep }) {
  if (step < 2) return null
  const buried = step >= 3
  return (
    <AnimatePresence>
      {!buried && (
        <motion.image
          key="walnut-visible"
          href={walnutInHolePng}
          x="150" y="155" width="60" height="32"
          preserveAspectRatio="xMidYMid meet"
          variants={dropIn}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          data-asset="diofa/walnut-in-hole.png"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}

/** Soil mound covering the walnut — step 3 onward */
function SoilCover({ step }: { step: PlantingStep }) {
  if (step < 3) return null
  const fullyPatted = step >= 4
  return (
    <motion.image
      href={soilMoundPng}
      x="135" y="145" width="90" height="42"
      preserveAspectRatio="xMidYMid meet"
      variants={scaleIn}
      initial="hidden"
      animate={{ opacity: 1, scale: fullyPatted ? 1 : 0.8 }}
      transition={{ ...SPRING }}
      data-asset="diofa/soil-mound.png"
      aria-hidden="true"
    />
  )
}

/** Wooden name stake — appears at step 5 */
function NameStake({ step }: { step: PlantingStep }) {
  if (step < 5) return null
  return (
    <motion.image
      href={nameStakePng}
      x="200" y="125" width="40" height="55"
      preserveAspectRatio="xMidYMid meet"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      data-asset="diofa/name-stake.png"
      aria-hidden="true"
    />
  )
}

/** Small stones, fallen leaf, moisture spots — step 6 */
function SwipeDetails({ step }: { step: PlantingStep }) {
  if (step < 6) return null
  return (
    <motion.image
      href={swipeDetailsPng}
      x="125" y="155" width="120" height="32"
      preserveAspectRatio="xMidYMid meet"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      data-asset="diofa/swipe-details.png"
      aria-hidden="true"
    />
  )
}

/** Watering can + drops — step 7 (plan generation loading) */
function WateringCan({ step }: { step: PlantingStep }) {
  if (step < 7) return null
  return (
    <motion.image
      href={wateringCanPng}
      x="70" y="80" width="130" height="80"
      preserveAspectRatio="xMidYMid meet"
      variants={dropIn}
      initial="hidden"
      animate="visible"
      data-asset="diofa/watering-can.png"
      aria-hidden="true"
    />
  )
}

/** Dark moist glow on soil — step 8 (plan reveal, seed fully planted) */
function MoistGlow({ step }: { step: PlantingStep }) {
  if (step < 8) return null
  return (
    <motion.g
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      <radialGradient id="moist-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3A2210" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#3A2210" stopOpacity="0" />
      </radialGradient>
      <ellipse cx="180" cy="168" rx="60" ry="18" fill="url(#moist-glow)" />
    </motion.g>
  )
}

/** Mag-complete subtle glow ring — step 9 (user accepts plan) */
function MagGlow({ step }: { step: PlantingStep }) {
  if (step < 9) return null
  return (
    <motion.g
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      <motion.ellipse
        cx="180" cy="167" rx="44" ry="15"
        fill="none"
        stroke="#8B6040"
        strokeWidth="1.5"
        opacity={0.5}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  )
}

/** Csemete sprout — two cotyledon leaves, appears at step 10 */
function Sprout({ step }: { step: PlantingStep }) {
  if (step < 10) return null
  return (
    <motion.image
      href={sproutCsemetePng}
      x="158" y="115" width="44" height="55"
      preserveAspectRatio="xMidYMid meet"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      data-asset="diofa/sprout-csemete.png"
      aria-hidden="true"
    />
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlantingScene({ step, className = '', reducedMotion }: PlantingSceneProps) {
  const { t } = useTranslation()

  // Track the highest step ever rendered so we never animate backwards.
  // Stored in state (not a ref) so it is safe to read during render.
  const [highWaterMark, setHighWaterMark] = useState<PlantingStep>(step)
  // Ref mirrors the state value so the effect closure never goes stale.
  const highWaterRef = useRef<PlantingStep>(step)
  useEffect(() => {
    if (step > highWaterRef.current) {
      highWaterRef.current = step
      setHighWaterMark(step)
    }
  }, [step])

  // The "effective" step for rendering is always the max seen so far
  const effectiveStep = Math.max(step, highWaterMark) as PlantingStep

  const stepKey = String(effectiveStep) as keyof typeof stepDescriptions
  const stepDescriptions = {
    '0': t('onboarding.planting.steps.0'),
    '1': t('onboarding.planting.steps.1'),
    '2': t('onboarding.planting.steps.2'),
    '3': t('onboarding.planting.steps.3'),
    '4': t('onboarding.planting.steps.4'),
    '5': t('onboarding.planting.steps.5'),
    '6': t('onboarding.planting.steps.6'),
    '7': t('onboarding.planting.steps.7'),
    '8': t('onboarding.planting.steps.8'),
    '9': t('onboarding.planting.steps.9'),
    '10': t('onboarding.planting.steps.10'),
  }

  return (
    <div
      className={`relative w-full max-w-sm mx-auto select-none ${className}`}
      role="img"
      aria-label={t('onboarding.planting.ariaLabel')}
      aria-description={stepDescriptions[stepKey]}
      data-testid="planting-scene"
      data-step={effectiveStep}
      style={reducedMotion ? { '--framer-motion-reduced-motion': '1' } as React.CSSProperties : undefined}
    >
      {/*
        Viewbox 360×240 — landscape aspect for mobile. The soil horizon sits
        at y=160 leaving ~160px of sky above for the hand / watering can.
      */}
      <svg
        viewBox="0 0 360 240"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-hidden="true"
        focusable="false"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5EDD8" />
            <stop offset="100%" stopColor="#EDE0C4" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width="360" height="240" fill="url(#sky-gradient)" />

        {/* ---- SCENE LAYERS (bottom up in z-order) ---- */}

        <SoilBed />
        <Hole step={effectiveStep} />
        <WalnutInHole step={effectiveStep} />
        <SoilCover step={effectiveStep} />
        <SwipeDetails step={effectiveStep} />
        <MoistGlow step={effectiveStep} />
        <MagGlow step={effectiveStep} />
        <Sprout step={effectiveStep} />
        <NameStake step={effectiveStep} />
        <WateringCan step={effectiveStep} />
        <Hand step={effectiveStep} />
      </svg>

      <span className="sr-only" aria-live="polite">
        {stepDescriptions[stepKey]}
      </span>
    </div>
  )
}
