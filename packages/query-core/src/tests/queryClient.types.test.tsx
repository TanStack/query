import { describe, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { doNotExecute } from './utils'
import type { Equal, Expect } from './utils'
import type { DataTag, InfiniteData } from '../types'

describe('getQueryData', () => {
  it('should be typed if key is tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(queryKey)

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })

  it('should infer unknown if key is not tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(queryKey)

      const result: Expect<Equal<typeof data, unknown>> = true
      return result
    })
  })

  it('should infer passed generic if passed', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData<number>(queryKey)

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })

  it('should only allow Arrays to be passed', () => {
    doNotExecute(() => {
      const queryKey = 'key' as const
      const queryClient = new QueryClient()
      // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'QueryKey'
      return queryClient.getQueryData(queryKey)
    })
  })
})

describe('setQueryData', () => {
  it('updater should be typed if key is tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(queryKey, (prev) => {
        const result: Expect<Equal<typeof prev, number | undefined>> = true
        return result ? prev : 1
      })

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })

  it('value should be typed if key is tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      // @ts-expect-error value should be a number
      queryClient.setQueryData(queryKey, '1')

      // @ts-expect-error value should be a number
      queryClient.setQueryData(queryKey, () => '1')

      const data = queryClient.setQueryData(queryKey, 1)

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })

  it('should infer unknown for updater if key is not tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(queryKey, (prev) => {
        const result: Expect<Equal<typeof prev, unknown>> = true
        return result ? prev : 1
      })

      const result: Expect<Equal<typeof data, unknown>> = true
      return result
    })
  })

  it('should infer unknown for value if key is not tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(queryKey, 'foo')

      const result: Expect<Equal<typeof data, unknown>> = true
      return result
    })
  })

  it('should infer passed generic if passed', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData<string>(queryKey, (prev) => {
        const result: Expect<Equal<typeof prev, string | undefined>> = true
        return result ? prev : '1'
      })

      const result: Expect<Equal<typeof data, string | undefined>> = true
      return result
    })
  })

  it('should infer passed generic for value', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData<string>(queryKey, 'foo')

      const result: Expect<Equal<typeof data, string | undefined>> = true
      return result
    })
  })
})

describe('fetchInfiniteQuery', () => {
  it('should allow passing pages', () => {
    doNotExecute(async () => {
      const data = await new QueryClient().fetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        pages: 5,
      })

      const result: Expect<Equal<typeof data, InfiniteData<string, number>>> =
        true
      return result
    })
  })

  it('should not allow passing getNextPageParam without pages', () => {
    doNotExecute(async () => {
      return new QueryClient().fetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })
    })
  })

  it('should not allow passing pages without getNextPageParam', () => {
    doNotExecute(async () => {
      // @ts-expect-error Property 'getNextPageParam' is missing
      return new QueryClient().fetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        pages: 5,
      })
    })
  })
})
