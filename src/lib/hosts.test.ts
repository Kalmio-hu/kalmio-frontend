/** @vitest-environment node */
import { describe, it, expect } from 'vitest'
import { MAIN_ORIGIN, isMoveHost, mainOrigin } from './hosts'

describe('hosts', () => {
  it('recognises the Move landing host', () => {
    expect(isMoveHost('move.kalmio.hu')).toBe(true)
    expect(isMoveHost('move.localhost')).toBe(true)
    expect(isMoveHost('www.kalmio.hu')).toBe(false)
    expect(isMoveHost('localhost')).toBe(false)
  })

  it('keeps links in-app on the main site and sends them to it from the Move host', () => {
    expect(mainOrigin({ hostname: 'www.kalmio.hu', protocol: 'https:', port: '' })).toBe('')
    expect(mainOrigin({ hostname: 'move.kalmio.hu', protocol: 'https:', port: '' })).toBe(MAIN_ORIGIN)
    expect(mainOrigin({ hostname: 'move.localhost', protocol: 'http:', port: '5173' })).toBe('http://localhost:5173')
  })
})
