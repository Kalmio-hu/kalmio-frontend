/**
 * move.kalmio.hu serves only the Kalmio Move landing. The app, sign-in (Supabase
 * redirect allow-list) and the API's CORS allow-list live on the main site, so
 * every link that leaves the landing goes to the main origin.
 */
export const MAIN_ORIGIN = 'https://www.kalmio.hu'
export const MOVE_ORIGIN = 'https://move.kalmio.hu'

type HostLocation = Pick<Location, 'hostname' | 'protocol' | 'port'>

export function isMoveHost(hostname: string = window.location.hostname): boolean {
  return hostname.startsWith('move.')
}

/**
 * The main site's origin as seen from this host: empty on the main site itself
 * (links stay in-app), the local dev server from `move.localhost`.
 */
export function mainOrigin(loc: HostLocation = window.location): string {
  if (!isMoveHost(loc.hostname)) return ''
  if (loc.hostname.endsWith('.localhost')) return `${loc.protocol}//localhost${loc.port ? `:${loc.port}` : ''}`
  return MAIN_ORIGIN
}
