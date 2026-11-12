/**
 * BarionIdentity — sends the signed-in member's email to the Barion Pixel
 * (bp('identity', 'setEncryptedEmail', …)) once marketing consent is given.
 *
 * Renders nothing. Fires at most once per email per page load, and again only when the
 * member grants marketing consent later in the session.
 */

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { hasMarketingConsent, subscribeConsent } from '@/lib/consent'
import { setEncryptedEmail } from '@/lib/barionPixel'

export function BarionIdentity() {
  const email = useAuthStore((s) => s.session?.user?.email ?? null)
  const [marketing, setMarketing] = useState(() => hasMarketingConsent())
  const sentRef = useRef<string | null>(null)

  useEffect(() => subscribeConsent((choices) => setMarketing(choices.marketing)), [])

  useEffect(() => {
    if (!marketing || !email) return
    const normalised = email.trim().toLowerCase()
    if (sentRef.current === normalised) return
    sentRef.current = normalised
    void setEncryptedEmail(normalised)
  }, [marketing, email])

  return null
}
