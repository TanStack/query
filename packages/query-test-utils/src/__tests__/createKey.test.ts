import { describe, expect, it } from 'vitest'
import { createKey } from '../createKey'

describe('createKey', () => {
  it('should return a key', () => {
    const key = createKey()
    expect(key).toStrictEqual(['key-1'])
  })

  it('should return a new key each time', () => {
    expect(createKey()).not.toStrictEqual(createKey())
  })
})
