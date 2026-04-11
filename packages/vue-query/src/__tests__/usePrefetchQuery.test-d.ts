import { assertType, describe, expectTypeOf, it } from 'vitest'
import { ref } from 'vue-demi'
import { skipToken } from '@tanstack/query-core'
import { usePrefetchQuery } from '..'

describe('usePrefetchQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    assertType(
      usePrefetchQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2353
        refetchInterval: 1000,
      }),
    )

    assertType(
      usePrefetchQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2353
        enabled: true,
      }),
    )

    assertType(
      usePrefetchQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2353
        throwOnError: true,
      }),
    )
  })

  it('should accept refs in query options', () => {
    assertType(
      usePrefetchQuery({
        queryKey: ['key', ref('id')],
        queryFn: () => Promise.resolve(5),
        staleTime: ref(1000),
      }),
    )
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      usePrefetchQuery({
        queryKey: ['key'],
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )

    assertType(
      usePrefetchQuery({
        queryKey: ['key'],
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })
})
