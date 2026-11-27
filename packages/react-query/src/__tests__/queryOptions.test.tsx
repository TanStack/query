import { reusesQueryOptions } from '@tanstack/query-test-utils/descriptors'
import { describe, expect, it } from 'vitest'
import { queryOptions } from '../queryOptions'
import type { UseQueryOptions } from '../types'

describe('queryOptions', () => {
  it('should preserve the options with the reference identity promised by the package', () => {
    const object: UseQueryOptions = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    } as const

    const result = queryOptions(object)
    expect(result === object).toBe(reusesQueryOptions)
    expect(result).toMatchObject(object)
  })
})
