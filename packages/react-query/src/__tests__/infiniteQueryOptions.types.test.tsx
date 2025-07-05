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

const infiniteQuery = {
  options1: () =>
    infiniteQueryOptions({
      queryKey: ['key', 1] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
    }),
  options2: () =>
    infiniteQueryOptions({
      queryKey: ['key', 2] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
      initialData: () => ({ pageParams: [], pages: [{ field: 'success' }] }),
    }),
}

const Ex = () => {
  useInfiniteQuery({
    queryKey: ['key', 2] as const,
    queryFn: () => Promise.resolve({ field: 'success' }),
    initialData: () => ({ pageParams: [], pages: [{ field: 'success' }] }),
  })
}

describe('infiniteQueryOptions', () => {
  it('should be used with useInfiniteQuery', () => {
    const keyFn1Query = useInfiniteQuery(infiniteQuery.options1())
    expectTypeOf(keyFn1Query).toEqualTypeOf<
      UseInfiniteQueryResult<{ field: string }>
    >()
    expectTypeOf(keyFn1Query.data).toEqualTypeOf<
      InfiniteData<{ field: string }> | undefined
    >()
    const keyFn1Query_Select = useInfiniteQuery({
      ...infiniteQuery.options1(),
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
  it('should be used with useSuspenseInfiniteQuery', () => {
    const dd = infiniteQuery.options1()
    const keyFn1SuspenseQuery = useSuspenseInfiniteQuery(
      infiniteQuery.options1(),
    )
    expectTypeOf(keyFn1SuspenseQuery).toEqualTypeOf<
      UseSuspenseInfiniteQueryResult<{ field: string }>
    >()
    expectTypeOf(keyFn1SuspenseQuery.data).toEqualTypeOf<
      InfiniteData<{ field: string }>
    >()
    const keyFn1SuspenseQuery_Select = useSuspenseInfiniteQuery({
      ...infiniteQuery.options1(),
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
  it('should be used with useQueryClient', async () => {
    const queryClient = useQueryClient()

    queryClient.invalidateQueries(infiniteQuery.options1())
    queryClient.resetQueries(infiniteQuery.options1())
    queryClient.removeQueries(infiniteQuery.options1())
    queryClient.cancelQueries(infiniteQuery.options1())
    queryClient.prefetchQuery(infiniteQuery.options1())
    queryClient.refetchQueries(infiniteQuery.options1())

    const query1 = await queryClient.fetchQuery(infiniteQuery.options1())
    expectTypeOf(query1).toEqualTypeOf<InfiniteData<{ field: string }>>()
  })
})
