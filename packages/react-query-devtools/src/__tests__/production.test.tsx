import { describe, expect, it } from 'vitest'
import { ReactQueryDevtools } from '../index'

describe('ReactQueryDevtools in production mode', () => {
  it('should return null', () => {
    expect(ReactQueryDevtools({})).toBeNull()
  })
})
