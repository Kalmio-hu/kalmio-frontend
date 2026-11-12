import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  addToCart,
  contentView,
  grantConsent,
  initiateCheckout,
  initiatePurchase,
  purchase,
  rejectConsent,
  setEncryptedEmail,
  type BarionPixelProduct,
} from './barionPixel'

const MONTHLY: BarionPixelProduct = { id: 'kalmio-premium-monthly', name: 'Kalmio Prémium – havi', unitPrice: 1990 }
const FOUNDING: BarionPixelProduct = { id: 'kalmio-founding-member', name: 'Kalmio Alapító tagság', unitPrice: 19900 }

const MONTHLY_ITEM = {
  contentType: 'Product',
  currency: 'HUF',
  id: 'kalmio-premium-monthly',
  name: 'Kalmio Prémium – havi',
  quantity: 1,
  unit: 'pcs',
  unitPrice: 1990,
  totalItemPrice: 1990,
}

let bp: ReturnType<typeof vi.fn>

beforeEach(() => {
  bp = vi.fn()
  vi.stubGlobal('window', { bp })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('barionPixel', () => {
  it('is a no-op when the base pixel is not loaded', () => {
    vi.stubGlobal('window', {})
    expect(() => {
      grantConsent()
      contentView(MONTHLY)
      purchase([MONTHLY])
    }).not.toThrow()
  })

  it('never lets a throwing bp break the page', () => {
    vi.stubGlobal('window', { bp: () => { throw new Error('bp.js exploded') } })
    expect(() => addToCart(MONTHLY)).not.toThrow()
  })

  it('sends marketing consent through the consent namespace', () => {
    grantConsent()
    rejectConsent()
    expect(bp.mock.calls).toEqual([
      ['consent', 'grantConsent'],
      ['consent', 'rejectConsent'],
    ])
  })

  it('contentView carries the product fields without totalItemPrice', () => {
    contentView(MONTHLY)
    const { totalItemPrice: _omit, ...withoutTotal } = MONTHLY_ITEM
    void _omit
    expect(bp).toHaveBeenCalledWith('track', 'contentView', withoutTotal)
  })

  it('addToCart sends the full item with totalItemPrice', () => {
    addToCart({ ...MONTHLY, quantity: 2 })
    expect(bp).toHaveBeenCalledWith('track', 'addToCart', {
      ...MONTHLY_ITEM,
      quantity: 2,
      totalItemPrice: 3980,
      step: 1,
    })
  })

  it('checkout events carry contents, currency, revenue and step', () => {
    initiateCheckout([MONTHLY])
    initiatePurchase([MONTHLY, FOUNDING])
    expect(bp).toHaveBeenNthCalledWith(1, 'track', 'initiateCheckout', {
      contents: [MONTHLY_ITEM],
      currency: 'HUF',
      revenue: 1990,
      step: 1,
    })
    const [, , payload] = bp.mock.calls[1]
    expect(bp.mock.calls[1][1]).toBe('initiatePurchase')
    expect(payload.revenue).toBe(21890)
    expect(payload.contents.map((c: { id: string }) => c.id)).toEqual(['kalmio-premium-monthly', 'kalmio-founding-member'])
    expect(payload.step).toBe(2)
  })

  it('purchase reports a failure with step -1', () => {
    purchase([MONTHLY])
    purchase([MONTHLY], { failed: true })
    expect(bp.mock.calls[0][2].step).toBe(3)
    expect(bp.mock.calls[1][2]).toEqual({ contents: [MONTHLY_ITEM], currency: 'HUF', revenue: 1990, step: -1 })
  })

  it('setEncryptedEmail lowercases and sends a SHA-1 digest through the identity namespace', async () => {
    await setEncryptedEmail('  Zoltan+Test@Kalmio.HU ')
    expect(bp).toHaveBeenCalledTimes(1)
    const [ns, ev, value] = bp.mock.calls[0]
    expect([ns, ev]).toEqual(['identity', 'setEncryptedEmail'])
    // sha1('zoltan+test@kalmio.hu')
    const expected = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode('zoltan+test@kalmio.hu'))),
      (b) => b.toString(16).padStart(2, '0'),
    ).join('')
    expect(value).toBe(expected)
    expect(value).toMatch(/^[a-f0-9]{40}$/)
  })

  it('setEncryptedEmail falls back to the lowercase address without Web Crypto', async () => {
    vi.stubGlobal('crypto', undefined)
    await setEncryptedEmail('Member@Example.com')
    expect(bp).toHaveBeenCalledWith('identity', 'setEncryptedEmail', 'member@example.com')
  })

  it('setEncryptedEmail ignores values that are not addresses', async () => {
    await setEncryptedEmail('   ')
    await setEncryptedEmail('not-an-email')
    expect(bp).not.toHaveBeenCalled()
  })
})
