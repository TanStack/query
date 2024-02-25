import { describe, expect, it } from 'vitest'
import { ReactQueryDevtools } from '..'

describe('ReactQueryDevtools not in process.env.NODE_ENV=development', () => {
  it('should return null', () => {
    expect(process.env.NODE_ENV).not.toBe('development')
    expect(ReactQueryDevtools({})).toBeNull()
  })
})
