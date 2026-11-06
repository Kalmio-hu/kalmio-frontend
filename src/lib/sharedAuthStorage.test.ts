import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))

/** A minimal browser: a cookie jar that honours Max-Age=0, and an in-memory localStorage. */
function fakeBrowser(hostname: string) {
  const jar = new Map<string, string>()
  const local = new Map<string, string>()
  vi.stubGlobal('window', { location: { hostname } })
  vi.stubGlobal('document', {
    get cookie() { return [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
    set cookie(raw: string) {
      const [pair, ...attrs] = raw.split('; ')
      const i = pair.indexOf('=')
      const name = pair.slice(0, i)
      if (attrs.includes('Max-Age=0')) jar.delete(name)
      else jar.set(name, pair.slice(i + 1))
    },
  })
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => local.get(k) ?? null,
    setItem: (k: string, v: string) => void local.set(k, v),
    removeItem: (k: string) => void local.delete(k),
  })
  return { jar, local }
}

async function storage() {
  vi.resetModules()
  return (await import('./sharedAuthStorage')).sharedAuthStorage
}

describe('sharedAuthStorage', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('keeps localStorage outside kalmio.hu', async () => {
    const { jar, local } = fakeBrowser('localhost')
    const s = await storage()
    s.setItem('sb-x-auth-token', '{"a":1}')
    expect(local.get('sb-x-auth-token')).toBe('{"a":1}')
    expect(jar.size).toBe(0)
  })

  it('round-trips a large session through chunked cookies on a kalmio.hu subdomain', async () => {
    const { jar, local } = fakeBrowser('home.kalmio.hu')
    const s = await storage()
    const value = JSON.stringify({ token: 'x'.repeat(7000), name: 'Zoltán; ő=ű' })
    s.setItem('sb-x-auth-token', value)
    expect(jar.size).toBeGreaterThan(2)
    expect(local.size).toBe(0)
    expect(s.getItem('sb-x-auth-token')).toBe(value)

    s.setItem('sb-x-auth-token', 'short')
    expect(jar.size).toBe(1)
    expect(s.getItem('sb-x-auth-token')).toBe('short')

    s.removeItem('sb-x-auth-token')
    expect(jar.size).toBe(0)
    expect(s.getItem('sb-x-auth-token')).toBeNull()
  })

  it('moves a session saved in localStorage into the shared cookies', async () => {
    const { jar, local } = fakeBrowser('www.kalmio.hu')
    local.set('sb-x-auth-token', '{"legacy":true}')
    const s = await storage()
    expect(s.getItem('sb-x-auth-token')).toBe('{"legacy":true}')
    expect(local.has('sb-x-auth-token')).toBe(false)
    expect(jar.get('sb-x-auth-token.0')).toBeDefined()
    expect(s.getItem('sb-x-auth-token')).toBe('{"legacy":true}')
  })
})
