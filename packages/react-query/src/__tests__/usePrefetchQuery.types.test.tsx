import { expectTypeOf } from 'expect-type'
import { usePrefetchQuery } from '..'
import { doNotExecute } from './utils'

describe('usePrefetchQuery', () => {
  it('should return nothing', () => {
    doNotExecute(() => {
      const result = usePrefetchQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      expectTypeOf(result).toEqualTypeOf<void>()
    })
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    doNotExecute(() => {
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

  it('should not allow skipToken in queryFn', () => {
    doNotExecute(() => {
      usePrefetchQuery({
        queryKey: ['key'],
        // @ts-expect-error
        queryFn: skipToken,
      })
      usePrefetchQuery({
        queryKey: ['key'],
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      })
    })
  })
})
