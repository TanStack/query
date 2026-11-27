import { describe, expectTypeOf, it } from 'vitest'
import {
  keepPreviousData,
  placeholderData,
  select,
  useInfiniteQuery,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import type { InfiniteData } from '..'

describe('projection feature types', () => {
  const options = { queryKey: ['orders'], queryFn: () => ({ count: 2 }) }
  const count = (order: { count: number }) => order.count

  it('infers the output of a typed selector and preserves the query function data', () => {
    const result = useQuery({
      ...options,
      placeholderData: placeholderData(keepPreviousData),
      select: select(count),
    })
    expectTypeOf(result.data).toEqualTypeOf<number | undefined>()
    const suspense = useSuspenseQuery({
      ...options,
      select: [
        select,
        (order) => {
          expectTypeOf(order).toEqualTypeOf<{ count: number }>()
          return order.count
        },
      ],
    })
    expectTypeOf(suspense.data).toEqualTypeOf<number>()
  })

  it('infers cached pages and the page parameter before selection', () => {
    const paging = {
      ...options,
      initialPageParam: 0,
      getNextPageParam: () => 1,
    }
    const regular = useInfiniteQuery({
      ...paging,
      select: [
        select,
        (data) => {
          expectTypeOf(data).toEqualTypeOf<
            InfiniteData<{ count: number }, number>
          >()
          return data.pages.length
        },
      ],
    })
    const suspense = useSuspenseInfiniteQuery({
      ...paging,
      select: [select, (data) => data.pageParams.join(',')],
    })
    expectTypeOf(regular.data).toEqualTypeOf<number | undefined>()
    expectTypeOf(suspense.data).toEqualTypeOf<string>()
  })

  it('requires the feature for observer selectors and placeholders', () => {
    expectTypeOf(select(count)).toEqualTypeOf<
      readonly [typeof select, typeof count]
    >()
    // @ts-expect-error Plain selector callbacks do not install the projection feature.
    useQuery({ ...options, select: count })
    // @ts-expect-error Plain placeholder data does not install the placeholder feature.
    useQuery({ ...options, placeholderData: { count: 1 } })
  })
})
