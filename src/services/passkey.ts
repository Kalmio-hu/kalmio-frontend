import {
  startRegistration,
  startAuthentication,
  WebAuthnAbortService,
} from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { api } from '@/lib/api'

// ── Types mirroring the backend DTOs ──────────────────────────────────────

export interface PasskeyInfo {
  id: string
  friendlyName: string | null
  aaguid: string | null
  createdAt: string
}

interface RegisterStartResponse {
  challenge: string
  rp: { id: string; name: string }
  user: { id: string; name: string; displayName: string }
  excludeCredentialIds: string[]
  friendlyName: string | null
}

interface AuthenticateStartResponse {
  challenge: string
  rpId: string
  allowCredentials: string[]
}

interface AuthenticateFinishResponse {
  accessToken: string
  userId: string
  email: string
  role: string
}

// ── Registration (requires existing session — Supabase Bearer token in header) ──

/**
 * Full registration ceremony:
 * 1. Ask backend for a challenge
 * 2. Prompt browser biometric via navigator.credentials.create()
 * 3. Send attestation to backend to store
 */
export async function registerPasskey(friendlyName: string): Promise<PasskeyInfo> {
  // Step 1: get challenge from backend
  const { data: startData } = await api.post<RegisterStartResponse>(
    '/api/passkey/register/start',
    { friendlyName },
  )

  // Step 2: map backend response to @simplewebauthn options shape
  const creationOptions: PublicKeyCredentialCreationOptionsJSON = {
    challenge: startData.challenge,
    rp: startData.rp,
    user: startData.user,
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    excludeCredentials: startData.excludeCredentialIds.map((id) => ({
      id,
      type: 'public-key' as const,
    })),
    authenticatorSelection: {
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
    },
  }

  const registrationResponse = await startRegistration({ optionsJSON: creationOptions })

  // Step 3: send attestation to backend
  const { data: passkeyInfo } = await api.post<PasskeyInfo>(
    '/api/passkey/register/finish',
    {
      clientDataJSON: registrationResponse.response.clientDataJSON,
      attestationObject: registrationResponse.response.attestationObject,
      credentialId: registrationResponse.id,
      friendlyName,
    },
  )

  return passkeyInfo
}

// ── Authentication (unauthenticated — returns a JWT) ──────────────────────

/**
 * Full authentication ceremony:
 * 1. Ask backend for a challenge by email
 * 2. Prompt browser biometric via navigator.credentials.get()
 * 3. Send assertion to backend — receives JWT on success
 */
export async function authenticateWithPasskey(email: string): Promise<AuthenticateFinishResponse> {
  // Step 1: get challenge
  const { data: startData } = await api.post<AuthenticateStartResponse>(
    '/api/passkey/authenticate/start',
    { email },
  )

  // Step 2: map to @simplewebauthn options shape
  const requestOptions: PublicKeyCredentialRequestOptionsJSON = {
    challenge: startData.challenge,
    rpId: startData.rpId,
    allowCredentials: startData.allowCredentials.map((id) => ({
      id,
      type: 'public-key' as const,
    })),
    timeout: 60000,
    userVerification: 'required',
  }

  const authenticationResponse = await startAuthentication({ optionsJSON: requestOptions })

  // Step 3: verify assertion
  const { data: finishData } = await api.post<AuthenticateFinishResponse>(
    '/api/passkey/authenticate/finish',
    {
      credentialId: authenticationResponse.id,
      clientDataJSON: authenticationResponse.response.clientDataJSON,
      authenticatorData: authenticationResponse.response.authenticatorData,
      signature: authenticationResponse.response.signature,
    },
  )

  return finishData
}

// ── Discoverable authentication (no email needed) ────────────────────────────

/**
 * Discoverable-credential authentication — no email required.
 * The browser presents all passkeys registered for this RP.
 */
export async function authenticateWithPasskeyDiscoverable(): Promise<AuthenticateFinishResponse> {
  const { data: startData } = await api.post<AuthenticateStartResponse>(
    '/api/passkey/authenticate/discoverable/start',
    {},
  )

  const requestOptions: PublicKeyCredentialRequestOptionsJSON = {
    challenge: startData.challenge,
    rpId: startData.rpId,
    allowCredentials: [],
    timeout: 60000,
    userVerification: 'required',
  }

  const authenticationResponse = await startAuthentication({ optionsJSON: requestOptions })

  const { data: finishData } = await api.post<AuthenticateFinishResponse>(
    '/api/passkey/authenticate/discoverable/finish',
    {
      credentialId: authenticationResponse.id,
      clientDataJSON: authenticationResponse.response.clientDataJSON,
      authenticatorData: authenticationResponse.response.authenticatorData,
      signature: authenticationResponse.response.signature,
    },
  )

  return finishData
}

// ── Ceremony abort ────────────────────────────────────────────────────────

/**
 * Cancel any in-flight navigator.credentials.get() or .create() call.
 * Call this when the user explicitly dismisses the passkey UI so the native
 * OS-level WebAuthn sheet is closed and other auth buttons become interactive.
 */
export function cancelPasskeyCeremony(): void {
  WebAuthnAbortService.cancelCeremony()
}

// ── Credential management ─────────────────────────────────────────────────

export async function listPasskeys(): Promise<PasskeyInfo[]> {
  const { data } = await api.get<PasskeyInfo[]>('/api/passkey')
  return data
}

export async function deletePasskey(id: string): Promise<void> {
  await api.delete(`/api/passkey/${id}`)
}
