import { describe, expect, it } from 'vitest'
import {
  formatDateTime,
  getNavigatorLocales,
  resolveDateTimeLocale,
} from '../locale'

describe('locale helpers', () => {
  it('uses the first valid locale from navigator languages', () => {
    expect(resolveDateTimeLocale(['undefined', 'en-GB', 'fr-FR'])).toBe('en-GB')
  })

  it('falls back to en-US when no provided locale is valid', () => {
    expect(resolveDateTimeLocale(['undefined', 'en_US', null])).toBe('en-US')
  })

  it(
    'formats dates without throwing when navigator.language is invalid',
    { timeout: 20_000 },
    () => {
      const submittedAt = new Date('2026-03-28T12:34:56.000Z')
      const locales = getNavigatorLocales({
        language: 'undefined',
        languages: ['undefined'],
      })

      expect(formatDateTime(submittedAt, locales)).toBe(
        submittedAt.toLocaleString('en-US'),
      )
    },
  )
})
