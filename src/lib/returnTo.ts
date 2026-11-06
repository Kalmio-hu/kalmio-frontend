import type { NavigateFunction } from 'react-router-dom'

/** Other Kalmio apps that may send a user here to sign in and get them back afterwards. */
const EXTERNAL_RETURN_ORIGINS = ['https://home.kalmio.hu']

/** The full URL when `raw` points into an allowed Kalmio app, otherwise null (no open redirect). */
export function externalReturnUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return EXTERNAL_RETURN_ORIGINS.includes(url.origin) ? url.href : null
  } catch {
    return null
  }
}

/** Leaves for an allowed Kalmio app, or navigates inside this one. */
export function goToReturn(navigate: NavigateFunction, dest: string) {
  const external = externalReturnUrl(dest)
  if (external) window.location.assign(external)
  else navigate(dest, { replace: true })
}
