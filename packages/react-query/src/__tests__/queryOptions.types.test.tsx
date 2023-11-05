import { describe, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryOptions } from '../queryOptions'
import { useQuery } from '../useQuery'
import { useQueries } from '../useQueries'
import { useSuspenseQuery } from '../useSuspenseQuery'
import { doNotExecute } from './utils'
import type { dataTagSymbol } from '@tanstack/query-core'
import type { Equal, Expect } from './utils'

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    doNotExecute(() => {
      return queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      })
    })
  })
  it('should infer types for callbacks', () => {
    doNotExecute(() => {
      return queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        staleTime: 1000,
        select: (data) => {
          const result: Expect<Equal<number, typeof data>> = true
          return result
        },
      })
    })
  })
  it('should work when passed to useQuery', () => {
    doNotExecute(() => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const { data } = useQuery(options)

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })
  it('should work when passed to useSuspenseQuery', () => {
    doNotExecute(() => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const { data } = useSuspenseQuery(options)

      const result: Expect<Equal<typeof data, number>> = true
      return result
    })
  })
  it('should work when passed to fetchQuery', () => {
    doNotExecute(async () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const data = await new QueryClient().fetchQuery(options)

      const result: Expect<Equal<typeof data, number>> = true
      return result
    })
  })
  it('should work when passed to useQueries', () => {
    doNotExecute(() => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const [{ data }] = useQueries({
        queries: [options],
      })

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    doNotExecute(() => {
      const { queryKey } = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const result: Expect<
        Equal<(typeof queryKey)[typeof dataTagSymbol], number>
      > = true
      return result
    })

    it('should tag the queryKey even if no promise is returned', () => {
      doNotExecute(() => {
        const { queryKey } = queryOptions({
          queryKey: ['key'],
          queryFn: () => 5,
        })

        const result: Expect<
          Equal<(typeof queryKey)[typeof dataTagSymbol], number>
        > = true
        return result
      })
    })

    it('should tag the queryKey with unknown if there is no queryFn', () => {
      doNotExecute(() => {
        const { queryKey } = queryOptions({
          queryKey: ['key'],
        })

        const result: Expect<
          Equal<(typeof queryKey)[typeof dataTagSymbol], unknown>
        > = true
        return result
      })
    })

    it('should return the proper type when passed to getQueryData', () => {
      doNotExecute(() => {
        const { queryKey } = queryOptions({
          queryKey: ['key'],
          queryFn: () => Promise.resolve(5),
        })

        const queryClient = new QueryClient()
        const data = queryClient.getQueryData(queryKey)

        const result: Expect<Equal<typeof data, number | undefined>> = true
        return result
      })
    })

    it('should properly type updaterFn when passed to setQueryData', () => {
      doNotExecute(() => {
        const { queryKey } = queryOptions({
          queryKey: ['key'],
          queryFn: () => Promise.resolve(5),
        })

        const queryClient = new QueryClient()
        const data = queryClient.setQueryData(queryKey, (prev) => {
          const result: Expect<Equal<typeof prev, number | undefined>> = true
          return result ? prev : 1
        })

        const result: Expect<Equal<typeof data, number | undefined>> = true
        return result
      })
    })

    it('should properly type value when passed to setQueryData', () => {
      doNotExecute(() => {
        const { queryKey } = queryOptions({
          queryKey: ['key'],
          queryFn: () => Promise.resolve(5),
        })

        const queryClient = new QueryClient()

        // @ts-expect-error value should be a number
        queryClient.setQueryData(queryKey, '5')
        // @ts-expect-error value should be a number
        queryClient.setQueryData(queryKey, () => '5')

        const data = queryClient.setQueryData(queryKey, 5)

        const result: Expect<Equal<typeof data, number | undefined>> = true
        return result
      })
    })
  })
})
