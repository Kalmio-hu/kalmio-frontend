/**
 * Grove — KALMIO-144 / E6.5
 *
 * A stylized SVG map showing all graduated Kalmio users as tree pins.
 * The current user's own pin is highlighted with a "Te" label.
 *
 * Data: TanStack Query → GET /api/grove/pins.
 * Falls back to mock data when the backend endpoint returns 404 (service layer
 * handles the fallback transparently).
 *
 * Route: /app/grove
 * Accessible from GraduationReveal (KALMIO-143) via the "View grove" button.
 *
 * Mobile-first: designed at 375 px, scales to 1280 px.
 * WCAG 2.1 AA: all interactive pins are keyboard-reachable with role="button".
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TreePine } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { GrovePinsResponse } from '@/types'

// ── Inline grove service (was services/grove.ts — deleted KALMIO-293) ─────────
const MOCK_GROVE_PINS: GrovePinsResponse = {
  pins: [
    { userId: 'mock-01', displayName: 'K.B.',  x: 48.2, y: 38.5, certificateId: null },
    { userId: 'mock-02', displayName: 'Sz.M.', x: 53.7, y: 44.1, certificateId: null },
    { userId: 'mock-03', displayName: 'V.A.',  x: 41.0, y: 51.3, certificateId: null },
    { userId: 'mock-04', displayName: 'N.P.',  x: 60.4, y: 35.8, certificateId: null },
    { userId: 'mock-05', displayName: 'H.Cs.', x: 35.6, y: 42.7, certificateId: null },
    { userId: 'mock-06', displayName: 'T.L.',  x: 56.1, y: 57.2, certificateId: null },
    { userId: 'mock-07', displayName: 'B.É.',  x: 44.8, y: 29.6, certificateId: null },
    { userId: 'mock-08', displayName: 'F.K.',  x: 63.2, y: 48.9, certificateId: null },
    { userId: 'mock-09', displayName: 'G.R.',  x: 38.3, y: 62.0, certificateId: null },
    { userId: 'mock-10', displayName: 'D.T.',  x: 50.9, y: 67.4, certificateId: null },
    { userId: 'mock-11', displayName: 'Cs.N.', x: 29.4, y: 55.1, certificateId: null },
    { userId: 'mock-12', displayName: 'M.Zs.', x: 68.7, y: 40.3, certificateId: null },
  ],
}

async function fetchGrovePins(): Promise<GrovePinsResponse> {
  try {
    const res = await api.get<GrovePinsResponse>('/api/grove/pins')
    return res.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) return MOCK_GROVE_PINS
    throw err
  }
}
import { GroveCelebrationSection } from '@/components/grove/GroveCelebrationSection'
import type { GrovePin } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

/** SVG viewBox dimensions — the grove illustration area. */
const VIEWBOX_W = 400
const VIEWBOX_H = 300

/**
 * Hungary-shaped abstract outline, simplified to a few SVG path commands.
 * This is a stylized, non-cartographically-accurate silhouette — intentionally
 * impressionistic, consistent with the product's warm, illustrative tone.
 * A real map tile will replace this when a Mapbox/Leaflet integration is scoped
 * (depends on licensing decision deferred from MVP).
 */
const HUNGARY_PATH =
  'M 60 120 C 70 80 130 60 180 55 C 220 50 270 60 310 80 C 340 95 360 115 350 140 ' +
  'C 340 165 310 175 280 180 C 260 185 240 195 210 200 C 180 205 150 200 120 190 ' +
  'C 90 180 65 160 60 140 Z'

/** Kalmio brand greens used throughout. */
const COLORS = {
  grove:    '#4F7942',
  groveHover: '#3e6133',
  groveLight: '#d4e8ce',
  mapFill:  '#eef6eb',
  mapStroke: '#c4dabb',
  pinOther: '#7aac6c',
  pinOtherText: '#1f4019',
  pinUser:  '#4F7942',
  pinUserText: '#ffffff',
  pinUserRing: '#2c5221',
  soil:     '#a67c52',
  sky:      '#e8f4e0',
} as const

// ── Sub-components ────────────────────────────────────────────────────────────

interface TreePinProps {
  pin: GrovePin
  isCurrentUser: boolean
  onSelect: (pin: GrovePin) => void
}

function GroveTreePin({ pin, isCurrentUser, onSelect }: TreePinProps) {
  const { t } = useTranslation()
  const cx = (pin.x / 100) * VIEWBOX_W
  const cy = (pin.y / 100) * VIEWBOX_H

  const label = isCurrentUser ? t('grove.youLabel') : pin.displayName
  const ariaLabel = isCurrentUser
    ? t('grove.yourPinAriaLabel')
    : t('grove.pinAriaLabel', { name: pin.displayName })

  const bgColor  = isCurrentUser ? COLORS.pinUser      : COLORS.pinOther
  const txtColor = isCurrentUser ? COLORS.pinUserText  : COLORS.pinOtherText
  const ringColor = isCurrentUser ? COLORS.pinUserRing : 'transparent'

  // Pill dimensions
  const PILL_W  = isCurrentUser ? 36 : 32
  const PILL_H  = 20
  const STEM_H  = 8

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(pin)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(pin) }}
    >
      {/* Ring highlight for current user */}
      {isCurrentUser && (
        <circle
          cx={cx}
          cy={cy - PILL_H / 2 - STEM_H - 4}
          r={PILL_W / 2 + 4}
          fill="none"
          stroke={ringColor}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}

      {/* Stem */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - STEM_H}
        stroke={bgColor}
        strokeWidth={isCurrentUser ? 2 : 1.5}
      />

      {/* Pill body */}
      <rect
        x={cx - PILL_W / 2}
        y={cy - STEM_H - PILL_H}
        width={PILL_W}
        height={PILL_H}
        rx={PILL_H / 2}
        fill={bgColor}
      />

      {/* Label */}
      <text
        x={cx}
        y={cy - STEM_H - PILL_H / 2 + 4}
        textAnchor="middle"
        fontSize={isCurrentUser ? 8 : 7}
        fontWeight={isCurrentUser ? 700 : 500}
        fill={txtColor}
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>

      {/* Tree icon — tiny SVG tree below pill */}
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fontSize={11}
        aria-hidden="true"
      >
        🌳
      </text>
    </g>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Grove() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  const currentUserId = session?.user?.id ?? null

  const { data, isLoading, isError } = useQuery({
    queryKey: ['grove', 'pins'] as const,
    queryFn: fetchGrovePins,
    staleTime: 60_000,
  })

  const pins = data?.pins ?? []
  const treeCount = pins.length

  // The current user's pin — present only if the backend returned it.
  // If the user is graduated but not yet in the list (race condition or 404
  // fallback), we inject a placeholder pin at a neutral position.
  const hasCurrentUserPin = currentUserId
    ? pins.some((p) => p.userId === currentUserId)
    : false

  const allPins: GrovePin[] = hasCurrentUserPin
    ? pins
    : [
        // Inject a neutral "Te" pin when the current user isn't in the list.
        // Position chosen to avoid the dense cluster in the mock set.
        {
          userId: currentUserId ?? 'current-user',
          displayName: t('grove.youLabel'),
          x: 47.5,
          y: 55.0,
          certificateId: null,
        },
        ...pins,
      ]

  function handlePinSelect(pin: GrovePin) {
    if (pin.certificateId) {
      // Future: open certificate modal or navigate to certificate route.
      // For now: no-op — certificate modal is out of scope for this ticket.
      return
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="
            flex items-center justify-center w-9 h-9 rounded-full
            bg-white/70 text-[#3d2008]/70 hover:bg-white hover:text-[#3d2008]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[#4F7942] focus-visible:ring-offset-1
            transition-colors shrink-0
          "
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <h1 className="font-headline font-bold text-lg text-[#1A1A1A] leading-tight truncate">
            {t('grove.title')}
          </h1>
          {!isLoading && !isError && treeCount > 0 && (
            <p className="text-xs text-[#3d2008]/60 mt-0.5">
              {t('grove.treeCount', { count: allPins.length })}
            </p>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <p className="px-4 pb-4 text-sm text-[#3d2008]/70 leading-relaxed">
        {t('grove.subtitle')}
      </p>

      {/* Content area */}
      <div className="flex-1 px-4 pb-6">
        {isLoading && (
          <div className="flex items-center justify-center h-64 text-[#3d2008]/50 text-sm">
            <span className="animate-pulse">{t('common.comingSoon')}</span>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {t('grove.loadingError')}
          </div>
        )}

        {!isLoading && (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-[#c4dabb]/60 bg-[#eef6eb]">
            {/* Grove SVG */}
            <svg
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
              width="100%"
              aria-label={t('grove.title')}
              role="img"
              style={{ display: 'block' }}
            >
              {/* Sky / background */}
              <rect width={VIEWBOX_W} height={VIEWBOX_H} fill={COLORS.sky} />

              {/* Decorative ground band */}
              <rect
                y={VIEWBOX_H - 30}
                width={VIEWBOX_W}
                height={30}
                fill={COLORS.soil}
                opacity={0.18}
              />

              {/* Hungary silhouette */}
              <path
                d={HUNGARY_PATH}
                fill={COLORS.mapFill}
                stroke={COLORS.mapStroke}
                strokeWidth={1.5}
              />

              {/* Grove label — bottom-left, inside silhouette */}
              <text
                x={90}
                y={160}
                fontSize={8}
                fill={COLORS.grove}
                fontFamily="system-ui, sans-serif"
                opacity={0.7}
                aria-hidden="true"
              >
                Kalmio-liget
              </text>

              {/* Tree pins */}
              {allPins.map((pin) => (
                <GroveTreePin
                  key={pin.userId}
                  pin={pin}
                  isCurrentUser={pin.userId === (currentUserId ?? 'current-user')}
                  onSelect={handlePinSelect}
                />
              ))}
            </svg>

            {/* "Your tree" callout — absolute bottom-right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <TreePine className="h-3.5 w-3.5 text-[#4F7942]" aria-hidden="true" />
              <span className="text-xs font-medium text-[#1A1A1A]">
                {t('grove.yourTree')}
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && allPins.length === 0 && (
          <p className="mt-6 text-center text-sm text-[#3d2008]/60">
            {t('grove.empty')}
          </p>
        )}

        {/* Legend */}
        {!isLoading && allPins.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#3d2008]/60">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: COLORS.pinUser }}
                aria-hidden="true"
              />
              {t('grove.yourTree')}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: COLORS.pinOther }}
                aria-hidden="true"
              />
              {t('grove.otherTrees')}
            </span>
          </div>
        )}

        {/* Celebration section — certificate download + premium trial offer (KALMIO-145) */}
        <GroveCelebrationSection />
      </div>
    </div>
  )
}
