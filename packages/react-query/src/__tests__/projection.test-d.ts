import { describe, expectTypeOf, it } from 'vitest'
import {
  infiniteQueryOptions,
  keepPreviousData,
  placeholderData,
  queryOptions,
  select,
  suspenseInfiniteQueryOptions,
  suspenseQueryOptions,
  useQuery,
} from '..'
import type { InfiniteData } from '..'

describe('projection feature types', () => {
  const options = { queryKey: ['orders'], queryFn: () => ({ count: 2 }) }
  const count = (order: { count: number }) => order.count

  it('infers the output of a typed selector and preserves the query function data', () => {
    const result = useQuery(
      queryOptions({
        ...options,
        placeholderData: placeholderData(keepPreviousData),
        select: select(count),
      }),
    )
    expectTypeOf(result.data).toEqualTypeOf<number | undefined>()
    const suspense = useQuery(
      suspenseQueryOptions({
        ...options,
        select: select((order) => {
          expectTypeOf(order).toEqualTypeOf<{ count: number }>()
          return order.count
        }),
      }),
    )
    expectTypeOf(suspense.data).toEqualTypeOf<number>()
  })

  it('infers a selection when extending a prepared post query', () => {
    const getPostOptions = (id: number) =>
      queryOptions({
        queryKey: ['post', id],
        queryFn: () => Promise.resolve({ id, title: 'TanStack Query' }),
      })

    const result = useQuery(
      queryOptions({
        ...getPostOptions(1),
        select: select((post) => {
          expectTypeOf(post).toEqualTypeOf<{ id: number; title: string }>()
          // @ts-expect-error Only fields returned by the fetcher can be selected.
          void post.missing
          return post.title
        }),
      }),
    )
    expectTypeOf(result.data).toEqualTypeOf<string | undefined>()
  })

  it('infers cached pages and the page parameter before selection', () => {
    const paging = {
      ...options,
      initialPageParam: 0,
      getNextPageParam: () => 1,
    }
    const regular = useQuery(
      infiniteQueryOptions({
        ...paging,
        select: select((data) => {
          expectTypeOf(data).toEqualTypeOf<
            InfiniteData<{ count: number }, number>
          >()
          return data.pages.length
        }),
      }),
    )
    const suspense = useQuery(
      suspenseInfiniteQueryOptions({
        ...paging,
        select: select((data) => data.pageParams.join(',')),
      }),
    )
    expectTypeOf(regular.data).toEqualTypeOf<number | undefined>()
    expectTypeOf(suspense.data).toEqualTypeOf<string>()
  })

  it('requires the feature for observer selectors and placeholders', () => {
    expectTypeOf(select(count)).returns.toEqualTypeOf<
      readonly [typeof select, typeof count]
    >()
    // @ts-expect-error Plain selector callbacks do not install the projection feature.
    useQuery(queryOptions({ ...options, select: count }))
    // @ts-expect-error Plain placeholder data does not install the placeholder feature.
    useQuery(queryOptions({ ...options, placeholderData: { count: 1 } }))
  })
})
