import { describe, expect, it } from 'vitest'
import { queryOptions } from '../query-options'
import type { CreateQueryOptions } from '../types'

describe('queryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object: CreateQueryOptions = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    } as const

    expect(queryOptions(object)).toBe(object)
  })
})
