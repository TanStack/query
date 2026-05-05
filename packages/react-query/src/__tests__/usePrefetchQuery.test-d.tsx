import { assertType, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { usePrefetchQuery } from '..'

describe('usePrefetchQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should not allow refetchInterval, or throwOnError options', () => {
    assertType(
      usePrefetchQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        refetchInterval: 1000,
      }),
    )

    assertType(
      usePrefetchQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        throwOnError: true,
      }),
    )
  })
})
