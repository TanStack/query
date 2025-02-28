import { describe, expectTypeOf, it } from 'vitest'
import { usePrefetchQueries } from '..'

describe('usePrefetchQueries', () => {
  it('should return nothing', () => {
    const result = usePrefetchQueries({
      queries: [
        {
          queryKey: ['key1'],
          queryFn: () => Promise.resolve(5),
        },
        {
          queryKey: ['key2'],
          queryFn: () => Promise.resolve(5),
        },
      ],
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    usePrefetchQueries({
      queries: [
        {
          queryKey: ['key1'],
          queryFn: () => Promise.resolve(5),
          // @ts-expect-error TS2345
          refetchInterval: 1000,
        },
      ],
    })

    usePrefetchQueries({
      queries: [
        {
          queryKey: ['key1'],
          queryFn: () => Promise.resolve(5),
          // @ts-expect-error TS2345
          enabled: true,
        },
      ],
    })

    usePrefetchQueries({
      queries: [
        {
          queryKey: ['key1'],
          queryFn: () => Promise.resolve(5),
          // @ts-expect-error TS2345
          throwOnError: true,
        },
      ],
    })
  })
})
