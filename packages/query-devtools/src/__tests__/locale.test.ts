import { describe, expect, it } from 'vitest'
import {
  formatDateTime,
  formatTime,
  getPreferredLocale,
  sanitizeLocale,
} from '../utils'

describe('locale utils', () => {
  it('falls back to en-US when navigator.language is an invalid string', () => {
    expect(
      getPreferredLocale({
        language: 'undefined',
        userLanguage: 'undefined',
      }),
    ).toBe('en-US')
  })

  it('keeps valid locale tags unchanged', () => {
    expect(
      getPreferredLocale({
        language: 'fr-FR',
      }),
    ).toBe('fr-FR')
  })

  it('sanitizes invalid locales before formatting dates', () => {
    const value = new Date('2024-01-02T03:04:05.000Z')

    expect(formatDateTime(value, 'undefined')).toBe(
      value.toLocaleString('en-US'),
    )
    expect(() => formatDateTime(value, 'undefined')).not.toThrow()
  })

  it('sanitizes invalid locales before formatting times', () => {
    const value = new Date('2024-01-02T03:04:05.000Z')

    expect(formatTime(value, 'undefined')).toBe(
      value.toLocaleTimeString('en-US'),
    )
    expect(() => formatTime(value, 'undefined')).not.toThrow()
  })

  it('falls back for empty locale values', () => {
    expect(sanitizeLocale('')).toBe('en-US')
    expect(sanitizeLocale('   ')).toBe('en-US')
  })
})
