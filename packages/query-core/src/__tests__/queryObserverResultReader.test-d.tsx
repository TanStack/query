import { describe, expectTypeOf, it } from 'vitest'
import { InfiniteQueryObserver, QueryClient, QueryObserver } from '..'
import type {
  DefaultedInfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryObserverResult,
  QueryObserverResultReader,
} from '..'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('result reader types', () => {
  it('preserves selected data and error types', () => {
    const client = new QueryClient()
    const options = client.defaultQueryOptions<
      number,
      CustomError,
      string,
      number,
      readonly ['value']
    >({
      queryKey: ['value'],
      queryFn: () => 1,
      select: String,
    })
    const observer = new QueryObserver(client, options)
    const reader = observer.createResultReader(options)
    expectTypeOf(reader).toEqualTypeOf<
      QueryObserverResultReader<QueryObserverResult<string, CustomError>>
    >()
    expectTypeOf(reader.getSnapshot()).toEqualTypeOf<
      QueryObserverResult<string, CustomError>
    >()
    expectTypeOf(reader.commit()).toEqualTypeOf<void>()
  })

  it('preserves infinite-query fields and selected data', () => {
    const options: DefaultedInfiniteQueryObserverOptions<
      number,
      CustomError,
      string,
      readonly ['value'],
      number
    > = {
      queryKey: ['value'],
      queryFn: ({ pageParam }) => pageParam,
      select: (data) => data.pages.join(','),
      initialPageParam: 0,
      getNextPageParam: (last) => last + 1,
      queryHash: 'value',
      throwOnError: false,
      refetchOnReconnect: true,
    }
    const observer = new InfiniteQueryObserver(new QueryClient(), options)
    const reader = observer.createResultReader(options)
    expectTypeOf(reader).toEqualTypeOf<
      QueryObserverResultReader<
        InfiniteQueryObserverResult<string, CustomError>
      >
    >()
    expectTypeOf(reader.getSnapshot()).toEqualTypeOf<
      InfiniteQueryObserverResult<string, CustomError>
    >()
    expectTypeOf(reader.commit()).toEqualTypeOf<void>()
  })
})
