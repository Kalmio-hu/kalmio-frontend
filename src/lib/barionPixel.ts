/**
 * Barion Pixel — Full events (docs/product/payments-subscriptions.md §3).
 *
 * The Base Pixel lives in index.html (bp('init', 'addBarionPixelId', …)) and loads on every page
 * for fraud prevention. These helpers send the Full Pixel events Barion requires on top of it.
 * Every helper is a no-op when `window.bp` is missing (ad blockers, tests, SSR).
 *
 * Property names follow Barion's Pixel API reference: contentType, currency, id, name, quantity,
 * unit, unitPrice, totalItemPrice; checkout events carry a `contents` array, `currency`,
 * `revenue` and `step`. bp.js rejects `totalItemPrice` on contentView, so it is left out there.
 */

export type BarionPixelProductId = 'kalmio-premium-monthly' | 'kalmio-premium-yearly' | 'kalmio-founding-member'

export interface BarionPixelProduct {
  id: BarionPixelProductId
  name: string
  /** Gross HUF. */
  unitPrice: number
  quantity?: number
}

type BpFunction = (...args: unknown[]) => void

const CURRENCY = 'HUF'
const UNIT = 'pcs'

function bp(): BpFunction | null {
  if (typeof window === 'undefined') return null
  const fn = (window as unknown as { bp?: BpFunction }).bp
  return typeof fn === 'function' ? fn : null
}

function send(...args: unknown[]): void {
  const fn = bp()
  if (!fn) return
  try {
    fn(...args)
  } catch {
    // The pixel must never break the page.
  }
}

/** Item shape for addToCart and the `contents` array of the checkout events. */
export function toPixelItem(product: BarionPixelProduct) {
  const quantity = product.quantity ?? 1
  return {
    contentType: 'Product' as const,
    currency: CURRENCY,
    id: product.id,
    name: product.name,
    quantity,
    unit: UNIT,
    unitPrice: product.unitPrice,
    totalItemPrice: product.unitPrice * quantity,
  }
}

function checkoutPayload(products: BarionPixelProduct[], step?: number) {
  const contents = products.map(toPixelItem)
  const revenue = contents.reduce((sum, c) => sum + c.totalItemPrice, 0)
  return step === undefined
    ? { contents, currency: CURRENCY, revenue }
    : { contents, currency: CURRENCY, revenue, step }
}

// ── Consent ───────────────────────────────────────────────────────────────────

export function grantConsent(): void {
  send('consent', 'grantConsent')
}

export function rejectConsent(): void {
  send('consent', 'rejectConsent')
}

// ── Identity ──────────────────────────────────────────────────────────────────

async function sha1Hex(value: string): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle
    if (!subtle || typeof TextEncoder === 'undefined') return null
    const digest = await subtle.digest('SHA-1', new TextEncoder().encode(value))
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

/**
 * Sends the signed-in member's email for Barion's identity matching. Call only with marketing
 * consent. The address is lowercased and SHA-1 hashed in the browser when Web Crypto is
 * available (bp.js accepts a 40-character hex digest and its plain-email validator rejects
 * valid addresses such as plus-addressing); otherwise the lowercase address is sent.
 */
export async function setEncryptedEmail(email: string): Promise<void> {
  const normalised = email.trim().toLowerCase()
  if (!normalised || !normalised.includes('@')) return
  const hashed = await sha1Hex(normalised)
  send('identity', 'setEncryptedEmail', hashed ?? normalised)
}

// ── Commerce events ───────────────────────────────────────────────────────────

/** One per offer shown on the pricing and Founding Member pages. */
export function contentView(product: BarionPixelProduct): void {
  send('track', 'contentView', {
    contentType: 'Product',
    currency: CURRENCY,
    id: product.id,
    name: product.name,
    quantity: product.quantity ?? 1,
    unit: UNIT,
    unitPrice: product.unitPrice,
  })
}

/** A plan was chosen. */
export function addToCart(product: BarionPixelProduct): void {
  send('track', 'addToCart', { ...toPixelItem(product), step: 1 })
}

/** The checkout form opened. */
export function initiateCheckout(products: BarionPixelProduct[]): void {
  send('track', 'initiateCheckout', checkoutPayload(products, 1))
}

/** Redirecting to the Barion gateway, or a transfer order was submitted. */
export function initiatePurchase(products: BarionPixelProduct[]): void {
  send('track', 'initiatePurchase', checkoutPayload(products, 2))
}

/** The success page learned the outcome. A failed payment is reported with step -1. */
export function purchase(products: BarionPixelProduct[], options: { failed?: boolean } = {}): void {
  send('track', 'purchase', checkoutPayload(products, options.failed ? -1 : 3))
}
