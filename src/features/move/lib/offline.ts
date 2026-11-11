/**
 * Offline helpers for the player (PRD §17 "logs sync later without loss").
 *
 * Mutations go through the normal Axios client. When the network is down the
 * service worker's BackgroundSync route (src/sw.ts, queue `kalmio-mutations`)
 * stores the request and replays it; the Axios promise still rejects with a
 * network error. `isOfflineError` recognises that case so the UI can treat it
 * as "queued" instead of "failed".
 */
import { isAxiosError } from 'axios'

export function isOfflineError(err: unknown): boolean {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  if (isAxiosError(err)) {
    if (err.response) return false
    return offline || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED'
  }
  return offline
}

/** Hands a blob to the browser as a download (FIT export). */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
