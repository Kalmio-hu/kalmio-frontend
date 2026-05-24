/**
 * DiofaWidget — walnut tree (diófa) growth + soil-moisture widget.
 *
 * Props:
 *   stage    — one of MAG | CSEMETE | SUHANG | FIATAL | TERMO
 *   moisture — one of DRY | OK | WET
 *
 * Each (stage, moisture) combination renders a hand-painted PNG from
 * src/assets/diofa/ (KALMIO-128 / KALMIO-129, the textured-ink + warm-
 * gouache illustration set). The component's 3-band moisture model maps
 * to the 4-band asset set as follows:
 *
 *   widget DRY  →  diofa-{STAGE}-DRY.png       (pale tan with hairline cracks)
 *   widget OK   →  diofa-{STAGE}-MOIST.png     (warm even brown)
 *   widget WET  →  diofa-{STAGE}-SATURATED.png (dark rich, leaves rustling)
 *
 * (The asset set's intermediate "DRYING" band is intentionally unused
 * until the widget's moisture model expands to 4 bands.)
 *
 * Mobile-first target: 360×360 px square (scales up on wider screens).
 * The asset set is 1:1; the widget container matches that aspect so the
 * full painted frame (sky + tree + soil) shows without cropping.
 * WCAG 2.1 AA: the outer container is role="img" with a localized aria-label;
 * the underlying <img> is aria-hidden.
 * Moisture-band CSS animation classes (see styles/diofa.css):
 *   .diofa-wet  → leaf-rustle keyframe (applied when moisture === 'WET')
 *   .diofa-dry  → no animation, soil-crack overlay visible
 */

import { useTranslation } from 'react-i18next'
import { getMoistureClass } from './diofaUtils'

import MagDry from '@/assets/diofa/diofa-MAG-DRY.png'
import MagMoist from '@/assets/diofa/diofa-MAG-MOIST.png'
import MagSaturated from '@/assets/diofa/diofa-MAG-SATURATED.png'
import CsemeteDry from '@/assets/diofa/diofa-CSEMETE-DRY.png'
import CsemeteMoist from '@/assets/diofa/diofa-CSEMETE-MOIST.png'
import CsemeteSaturated from '@/assets/diofa/diofa-CSEMETE-SATURATED.png'
import SuhangDry from '@/assets/diofa/diofa-SUHANG-DRY.png'
import SuhangMoist from '@/assets/diofa/diofa-SUHANG-MOIST.png'
import SuhangSaturated from '@/assets/diofa/diofa-SUHANG-SATURATED.png'
import FiatalDry from '@/assets/diofa/diofa-FIATAL-DRY.png'
import FiatalMoist from '@/assets/diofa/diofa-FIATAL-MOIST.png'
import FiatalSaturated from '@/assets/diofa/diofa-FIATAL-SATURATED.png'
import TermoDry from '@/assets/diofa/diofa-TERMO-DRY.png'
import TermoMoist from '@/assets/diofa/diofa-TERMO-MOIST.png'
import TermoSaturated from '@/assets/diofa/diofa-TERMO-SATURATED.png'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiofaStage = 'MAG' | 'CSEMETE' | 'SUHANG' | 'FIATAL' | 'TERMO'
export type DiofaMoisture = 'DRY' | 'OK' | 'WET'

export interface DiofaWidgetProps {
  stage: DiofaStage
  moisture: DiofaMoisture
  /** Optional extra class applied to the outer wrapper */
  className?: string
}

// ─── Asset lookup ─────────────────────────────────────────────────────────────

const DIOFA_PNG: Record<DiofaStage, Record<DiofaMoisture, string>> = {
  MAG: {
    DRY: MagDry,
    OK:  MagMoist,
    WET: MagSaturated,
  },
  CSEMETE: {
    DRY: CsemeteDry,
    OK:  CsemeteMoist,
    WET: CsemeteSaturated,
  },
  SUHANG: {
    DRY: SuhangDry,
    OK:  SuhangMoist,
    WET: SuhangSaturated,
  },
  FIATAL: {
    DRY: FiatalDry,
    OK:  FiatalMoist,
    WET: FiatalSaturated,
  },
  TERMO: {
    DRY: TermoDry,
    OK:  TermoMoist,
    WET: TermoSaturated,
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiofaWidget({ stage, moisture, className = '' }: DiofaWidgetProps) {
  const { t } = useTranslation()

  const ariaLabel = t('diofa.ariaLabel', {
    stage: t(`diofa.stages.${stage}`),
    moisture: t(`diofa.moisture.${moisture}`),
  })

  const moistureClass = getMoistureClass(moisture)
  const src = DIOFA_PNG[stage][moisture]

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={[
        'relative w-full max-w-[360px] mx-auto overflow-hidden rounded-xl',
        moistureClass,
        className,
      ].join(' ')}
      style={{ aspectRatio: '1 / 1' }}
    >
      <img
        src={src}
        alt=""
        aria-hidden
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Stage + moisture badge — for development visibility; hide in production if desired */}
      <span
        aria-hidden
        className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/30 text-white px-1.5 py-0.5 rounded"
      >
        {stage} · {moisture}
      </span>
    </div>
  )
}
