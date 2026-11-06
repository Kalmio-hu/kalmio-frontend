import type { Session } from '@supabase/supabase-js'
import { sharedAuthStorage } from '@/lib/sharedAuthStorage'

const STORAGE_KEY = 'kalmio-passkey-token'

export function buildSessionFromAccessToken(accessToken: string): Session {
  const payload = JSON.parse(atob(accessToken.split('.')[1]))
  const expiresAt = payload.exp as number
  return {
    access_token: accessToken,
    refresh_token: '',
    expires_at: expiresAt,
    expires_in: expiresAt - Math.floor(Date.now() / 1000),
    token_type: 'bearer',
    user: {
      id: payload.sub as string,
      email: payload.email as string,
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '',
    },
  } as Session
}

export function persistPasskeyToken(accessToken: string): void {
  sharedAuthStorage.setItem(STORAGE_KEY, accessToken)
}

export function clearPasskeyToken(): void {
  sharedAuthStorage.removeItem(STORAGE_KEY)
}

export function restorePasskeySession(): Session | null {
  const token = sharedAuthStorage.getItem(STORAGE_KEY)
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if ((payload.exp as number) <= Math.floor(Date.now() / 1000)) {
      sharedAuthStorage.removeItem(STORAGE_KEY)
      return null
    }
    return buildSessionFromAccessToken(token)
  } catch {
    sharedAuthStorage.removeItem(STORAGE_KEY)
    return null
  }
}
