import { describe, it, expect } from 'vitest'
import { externalReturnUrl } from './returnTo'

describe('externalReturnUrl', () => {
  it('accepts Kalmio Home', () => {
    expect(externalReturnUrl('https://home.kalmio.hu/spaces?x=1')).toBe('https://home.kalmio.hu/spaces?x=1')
  })

  it('rejects everything else', () => {
    for (const raw of [null, '', '/app', '//evil.com', 'https://evil.com', 'http://home.kalmio.hu/', 'https://home.kalmio.hu.evil.com/', 'javascript:alert(1)']) {
      expect(externalReturnUrl(raw)).toBeNull()
    }
  })
})
