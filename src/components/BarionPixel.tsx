/**
 * BarionPixel — injects the Base Barion Pixel (BP) once, app-wide.
 *
 * Required for Barion merchant approval: the Base Pixel is used for fraud
 * prevention / payment-security scoring. It is loaded site-wide (legitimate
 * interest — transaction security), and disclosed in the Privacy Notice and
 * Terms (Barion Pixel ÁSZF). See docs.barion.com "Pixel - Base".
 *
 * The pixel id comes from VITE_BARION_PIXEL_ID, with the production sandbox/live
 * id as a fallback so the pixel is present even if the env var is unset. The
 * pixel id is a public client-side identifier, not a secret.
 */

import { useEffect } from 'react'

const PIXEL_ID =
  (import.meta.env.VITE_BARION_PIXEL_ID as string | undefined) ?? 'BPT-P5LDPnfL4b-1B'

// Guard so the base script is injected only once even across remounts/HMR.
const SCRIPT_FLAG = '__barionPixelInjected'

export function BarionPixel() {
  useEffect(() => {
    if (!PIXEL_ID) return
    const w = window as unknown as Record<string, unknown> & {
      bp?: ((...args: unknown[]) => void) & { q?: unknown[]; l?: number }
    }
    if (w[SCRIPT_FLAG]) return
    w[SCRIPT_FLAG] = true

    // Canonical Base Barion Pixel bootstrap.
    w.bp =
      w.bp ||
      function (...args: unknown[]) {
        ;(w.bp!.q = w.bp!.q || []).push(args)
      }
    w.bp.l = 1 * Number(new Date())

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://pixel.barion.com/bp.js'
    const first = document.getElementsByTagName('script')[0]
    first?.parentNode?.insertBefore(script, first)

    w.bp('init', 'addBaseFunctions', PIXEL_ID)
    w.bp('track', 'contentView', {})
  }, [])

  // <noscript> fallback beacon for browsers without JS.
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        alt=""
        src={`https://pixel.barion.com/a.gif?ba_pixel_id=${PIXEL_ID}&ev=contentView&noscript=1`}
      />
    </noscript>
  )
}
