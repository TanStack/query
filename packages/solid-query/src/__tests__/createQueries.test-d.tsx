import { describe, expectTypeOf, it } from 'vitest'
import { queryOptions, useQueries } from '..'
import type { UseQueryResult } from '..'

describe('useQueries', () => {
  it('should return correct data for dynamic queries with mixed result types', () => {
    const Queries1 = {
      get: () =>
        queryOptions({
          queryKey: ['key1'],
          queryFn: () => Promise.resolve(1),
        }),
    }
    const Queries2 = {
      get: () =>
        queryOptions({
          queryKey: ['key2'],
          queryFn: () => Promise.resolve(true),
        }),
    }

    const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
    const result = useQueries(() => ({
      queries: [...queries1List, { ...Queries2.get() }],
    }))

    expectTypeOf(result).toEqualTypeOf<
      [
        ...Array<UseQueryResult<number, Error>>,
        UseQueryResult<boolean, Error>,
      ]
    >()
  })
})
