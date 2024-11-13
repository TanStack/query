import { describe, expectTypeOf, it } from 'vitest'
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
    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      refetchInterval: 1000,
    })

    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      enabled: true,
    })

    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      throwOnError: true,
    })
  })
})
