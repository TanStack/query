import { queryKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'

import { skipToken, usePrefetchQuery } from '..'

describe('usePrefetchQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should forward query data and query key types', () => {
    type CustomQueryKey = readonly ['key', number]

    usePrefetchQuery<string, Error, number, Array<string>, CustomQueryKey>({
      queryKey: ['key', 1],
      queryFn: (context) => {
        expectTypeOf(context.queryKey).toEqualTypeOf<CustomQueryKey>()
        return Promise.resolve('data')
      },
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<Array<string>>()
        return data.length
      },
    })
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
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
        enabled: true,
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

  it('should not allow skipToken in queryFn', () => {
    assertType(
      usePrefetchQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )
    assertType(
      usePrefetchQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })
})
