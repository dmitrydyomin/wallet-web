import { describe, expect, it } from 'vitest'
import { formatFieldValue } from '../src/apple/format.js'

describe('formatFieldValue', () => {
  it('formats dates in the given time zone', () => {
    const out = formatFieldValue(
      { key: 'd', value: '2026-10-12T19:30:00+02:00', dateStyle: 'PKDateStyleMedium', timeStyle: 'PKDateStyleShort' },
      '2026-10-12T19:30:00+02:00',
      { locale: 'en-US', timeZone: 'UTC' },
    )
    expect(out).toMatch(/Oct 12, 2026/)
    expect(out).toMatch(/5:30\s?PM/)
  })

  it('keeps the wall-clock time with ignoresTimeZone', () => {
    const out = formatFieldValue(
      { key: 'd', value: '', timeStyle: 'PKDateStyleShort', ignoresTimeZone: true },
      '2026-10-12T19:30:00+02:00',
      { locale: 'en-US', timeZone: 'America/Los_Angeles' },
    )
    expect(out).toMatch(/7:30\s?PM/)
  })

  it('formats relative dates', () => {
    const out = formatFieldValue({ key: 'd', value: '', isRelative: true, dateStyle: 'PKDateStyleShort' }, '2026-10-14T00:00:00Z', {
      locale: 'en-US',
      now: new Date('2026-10-12T00:00:00Z'),
    })
    expect(out).toBe('in 2 days')
  })

  it('formats currency and percent', () => {
    expect(formatFieldValue({ key: 'p', value: 12.5, currencyCode: 'USD' }, 12.5, { locale: 'en-US' })).toBe('$12.50')
    expect(formatFieldValue({ key: 'p', value: 0.25, numberStyle: 'PKNumberStylePercent' }, 0.25, { locale: 'en-US' })).toBe('25%')
  })

  it('passes plain strings through', () => {
    expect(formatFieldValue({ key: 'x', value: 'Hall A' }, 'Hall A')).toBe('Hall A')
  })
})
