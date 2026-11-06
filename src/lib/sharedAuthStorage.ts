import { Capacitor } from '@capacitor/core'

/**
 * Auth storage shared by every app on *.kalmio.hu (www.kalmio.hu, home.kalmio.hu): the Supabase
 * session and the passkey token live in cookies on `.kalmio.hu`, so signing in (or out) on one
 * app does the same on the others. Elsewhere (localhost, previews, the native app) it is plain
 * localStorage, as before.
 *
 * A copy of this file lives in kalmio-flow (web/src/lib/sharedAuthStorage.ts); keep the two in sync.
 */

const SHARED_DOMAIN = 'kalmio.hu'
const CHUNK_SIZE = 3000 // cookies cap at ~4 KB each, name and attributes included
const MAX_CHUNKS = 10
const MAX_AGE_S = 400 * 24 * 3600 // the longest lifetime browsers accept

function sharesCookies(): boolean {
  if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return false
  const host = window.location.hostname
  return host === SHARED_DOMAIN || host.endsWith(`.${SHARED_DOMAIN}`)
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  for (const part of document.cookie.split('; ')) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length))
  }
  return null
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Domain=.${SHARED_DOMAIN}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
}

function getChunked(key: string): string | null {
  const parts: string[] = []
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const part = readCookie(`${key}.${i}`)
    if (part === null) break
    parts.push(part)
  }
  return parts.length ? parts.join('') : null
}

function removeChunked(key: string) {
  for (let i = 0; i < MAX_CHUNKS; i++) {
    if (readCookie(`${key}.${i}`) === null) break
    writeCookie(`${key}.${i}`, '', 0)
  }
}

function setChunked(key: string, value: string) {
  removeChunked(key)
  for (let i = 0, n = 0; i < value.length; i += CHUNK_SIZE, n++) {
    writeCookie(`${key}.${n}`, value.slice(i, i + CHUNK_SIZE), MAX_AGE_S)
  }
}

function localGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function localSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* storage blocked */ }
}

function localRemove(key: string) {
  try { localStorage.removeItem(key) } catch { /* storage blocked */ }
}

export const sharedAuthStorage = {
  getItem(key: string): string | null {
    if (!sharesCookies()) return localGet(key)
    const shared = getChunked(key)
    if (shared !== null) return shared
    // One-time move of a session saved before the shared cookies existed, so nobody is signed out.
    const legacy = localGet(key)
    if (legacy !== null) {
      setChunked(key, legacy)
      localRemove(key)
    }
    return legacy
  },
  setItem(key: string, value: string) {
    if (!sharesCookies()) return localSet(key, value)
    setChunked(key, value)
    localRemove(key)
  },
  removeItem(key: string) {
    if (sharesCookies()) removeChunked(key)
    localRemove(key)
  },
}
