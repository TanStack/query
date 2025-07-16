import { expectTypeOf } from 'expect-type'
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  type UseSuspenseInfiniteQueryResult,
  useSuspenseInfiniteQuery,
} from '../useSuspenseInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { doNotExecute } from './utils'

const infiniteQuery = {
  options: () =>
    infiniteQueryOptions({
      queryKey: ['key', 1] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
    }),
  optionsWithInitialData: () =>
    infiniteQueryOptions({
      queryKey: ['key', 2] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
      initialData: () => ({ pageParams: [], pages: [{ field: 'success' }] }),
    }),
}

const Example = () => {
  useInfiniteQuery({
    queryKey: ['key', 2] as const,
    queryFn: () => Promise.resolve({ field: 'success' }),
    initialData: () => ({ pageParams: [], pages: [{ field: 'success' }] }),
  })
}

describe('infiniteQueryOptions', () => {
  it('should be used with useInfiniteQuery', () => {
    doNotExecute(() => {
      const keyFn1Query = useInfiniteQuery(infiniteQuery.options())
      expectTypeOf(keyFn1Query).toEqualTypeOf<
        UseInfiniteQueryResult<{ field: string }>
      >()
      expectTypeOf(keyFn1Query.data).toEqualTypeOf<
        InfiniteData<{ field: string }> | undefined
      >()
      const keyFn1Query_Select = useInfiniteQuery({
        ...infiniteQuery.options(),
        select: (data) => ({
          pages: data.pages.map(({ field }) => field),
          pageParams: data.pageParams,
        }),
      })
      expectTypeOf(keyFn1Query_Select).toEqualTypeOf<
        UseInfiniteQueryResult<string>
      >()
      expectTypeOf(keyFn1Query_Select.data).toEqualTypeOf<
        InfiniteData<string> | undefined
      >()
    })
  })
  it('should be used with useSuspenseInfiniteQuery', () => {
    doNotExecute(() => {
      const keyFn1SuspenseQuery = useSuspenseInfiniteQuery(
        infiniteQuery.options(),
      )
      expectTypeOf(keyFn1SuspenseQuery).toEqualTypeOf<
        UseSuspenseInfiniteQueryResult<{ field: string }>
      >()
      expectTypeOf(keyFn1SuspenseQuery.data).toEqualTypeOf<
        InfiniteData<{ field: string }>
      >()
      const keyFn1SuspenseQuery_Select = useSuspenseInfiniteQuery({
        ...infiniteQuery.options(),
        select: (data) => ({
          pages: data.pages.map(({ field }) => field),
          pageParams: data.pageParams,
        }),
      })
      expectTypeOf(keyFn1SuspenseQuery_Select).toEqualTypeOf<
        UseSuspenseInfiniteQueryResult<string>
      >()
      expectTypeOf(keyFn1SuspenseQuery_Select.data).toEqualTypeOf<
        InfiniteData<string>
      >()
    })
  })
  it('should be used with useQueryClient', () => {
    doNotExecute(async () => {
      const queryClient = useQueryClient()

      queryClient.invalidateQueries(infiniteQuery.options())
      queryClient.resetQueries(infiniteQuery.options())
      queryClient.removeQueries(infiniteQuery.options())
      queryClient.cancelQueries(infiniteQuery.options())
      queryClient.prefetchQuery(infiniteQuery.options())
      queryClient.refetchQueries(infiniteQuery.options())

      const query1 = await queryClient.fetchQuery(infiniteQuery.options())
      expectTypeOf(query1).toEqualTypeOf<InfiniteData<{ field: string }>>()
    })
  })
})
