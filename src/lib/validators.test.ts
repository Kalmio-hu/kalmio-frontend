import { describe, it, expect } from 'vitest'
import { isValidEmail } from './validators'

// D-FE04 / qa-2026-05-26 — ensure RFC-5321 local-part chars are accepted
describe('isValidEmail', () => {
  // ── Valid addresses ──────────────────────────────────────────────────────

  it('accepts a plain address', () => {
    expect(isValidEmail('teszt@example.com')).toBe(true)
  })

  it('accepts a plus-aliased address (the D-FE04 blocker)', () => {
    expect(isValidEmail('teszt+tag@example.com')).toBe(true)
  })

  it('accepts multiple plus aliases', () => {
    expect(isValidEmail('user+a+b@example.com')).toBe(true)
  })

  it('accepts dots in the local part', () => {
    expect(isValidEmail('nora.kovacs@example.com')).toBe(true)
  })

  it('accepts underscores in the local part', () => {
    expect(isValidEmail('user_name@example.com')).toBe(true)
  })

  it('accepts hyphens in the local part', () => {
    expect(isValidEmail('user-name@example.com')).toBe(true)
  })

  it('accepts percent signs in the local part', () => {
    expect(isValidEmail('user%tag@example.com')).toBe(true)
  })

  it('accepts combined special chars', () => {
    expect(isValidEmail('user.name+tag_2025%a-b@sub.example.co.uk')).toBe(true)
  })

  it('trims leading/trailing whitespace before validating', () => {
    expect(isValidEmail('  teszt+tag@example.com  ')).toBe(true)
  })

  // ── Invalid addresses ────────────────────────────────────────────────────

  it('rejects a bare word (no @)', () => {
    expect(isValidEmail('abc')).toBe(false)
  })

  it('rejects missing domain (local-part@ only)', () => {
    expect(isValidEmail('abc@')).toBe(false)
  })

  it('rejects missing local part (@domain.com)', () => {
    expect(isValidEmail('@def.com')).toBe(false)
  })

  it('rejects whitespace inside the address', () => {
    expect(isValidEmail('a b@c.com')).toBe(false)
  })

  it('rejects domain without TLD (abc@def)', () => {
    expect(isValidEmail('abc@def')).toBe(false)
  })

  it('rejects a leading dot in the local part', () => {
    expect(isValidEmail('.user@example.com')).toBe(false)
  })

  it('rejects consecutive dots in the local part', () => {
    expect(isValidEmail('user..name@example.com')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects whitespace-only input', () => {
    expect(isValidEmail('   ')).toBe(false)
  })
})
