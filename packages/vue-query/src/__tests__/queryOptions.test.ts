import { describe, expect, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { queryOptions } from '../queryOptions'
import type { QueryOptions } from '../queryOptions'

describe('queryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object: QueryOptions = {
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    } as const

    const options = queryOptions(object)
    expect(options).toBe(object)
  })
})
