import { describe, expect, it } from 'vitest'
import { queryOptions } from '../queryOptions'
import type { UseQueryOptions } from '../types'

describe('queryOptions', () => {
  it('should create a new descriptor and preserve the supplied options', () => {
    const object: UseQueryOptions = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    } as const

    const result = queryOptions(object)
    expect(result).not.toBe(object)
    expect(result).toMatchObject(object)
  })
})
