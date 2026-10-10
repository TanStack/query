import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { createInfiniteQuery, infiniteQueryOptions } from '../src/index.js'

describe('manual infinite query types', () => {
  it('should infer the page parameter and retain the mode through helpers and refetch', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['manual'],
      initialPageParam: 0,
      mode: 'manual',
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return String(pageParam)
      },
      select: (data) => {
        expectTypeOf(data.pageParams).toEqualTypeOf<Array<number>>()
        return data.pages
      },
    })
    expectTypeOf(options.mode).toEqualTypeOf<'manual'>()
    const query = createInfiniteQuery(() => options)
    expectTypeOf(query.data).toEqualTypeOf<Array<string> | undefined>()
    query.fetchNextPage({ pageParam: 2, cancelRefetch: false })
    query.fetchPreviousPage({ pageParam: -1, throwOnError: true })
    // @ts-expect-error manual queries require a page parameter
    query.fetchNextPage()
    // @ts-expect-error manual queries require a page parameter
    query.fetchPreviousPage({})
    // @ts-expect-error the page parameter must match initialPageParam
    query.fetchNextPage({ pageParam: '2' })
    // @ts-expect-error the page parameter must match initialPageParam
    query.fetchPreviousPage({ pageParam: '0' })

    const refetched = await query.refetch()
    refetched.fetchNextPage({ pageParam: 3 })
    // @ts-expect-error refetch preserves manual mode
    refetched.fetchNextPage()
    const next = await query.fetchNextPage({ pageParam: 3 })
    // @ts-expect-error fetching a page preserves manual mode
    next.fetchPreviousPage()

    const fetched = await new QueryClient().infiniteQuery(options)
    expectTypeOf(fetched).toEqualTypeOf<Array<string>>()
  })

  it('should retain defined data and manual mode with initialData', () => {
    const options = infiniteQueryOptions({
      queryKey: ['manual-initial'],
      mode: 'manual',
      queryFn: ({ pageParam }) => String(pageParam),
      initialPageParam: 0,
      initialData: { pages: ['0'], pageParams: [0] },
      select: (data) => data.pages,
    })
    const query = createInfiniteQuery(() => options)
    expectTypeOf(query.data).toEqualTypeOf<Array<string>>()
    query.fetchNextPage({ pageParam: 1 })
    // @ts-expect-error initialData preserves manual mode
    query.fetchNextPage()
  })

  it('should keep automatic fetching when mode is omitted', () => {
    const options = infiniteQueryOptions({
      queryKey: ['automatic'],
      queryFn: ({ pageParam }) => pageParam,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        expectTypeOf(lastPage).toEqualTypeOf<number>()
        return lastPage + 1
      },
    })
    const query = createInfiniteQuery(() => options)
    query.fetchNextPage()
    query.fetchPreviousPage({ cancelRefetch: false })
    // @ts-expect-error automatic queries do not accept a page parameter
    query.fetchNextPage({ pageParam: 2 })
    // @ts-expect-error automatic queries do not accept a page parameter
    query.fetchPreviousPage({ pageParam: -1 })
  })
})
