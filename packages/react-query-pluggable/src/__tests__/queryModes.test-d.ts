import { describe, expectTypeOf, it } from 'vitest'
import {
  infiniteQuery,
  query,
  select,
  skipToken,
  suspenseQuery,
  useQuery,
} from '..'
import type { InfiniteData } from '..'

describe('query render modes', () => {
  it('infers data for each render mode from the same query', () => {
    const options = { queryKey: ['post'], queryFn: () => ({ title: 'Dune' }) }
    expectTypeOf(useQuery(query(options)).data).toEqualTypeOf<
      { title: string } | undefined
    >()
    expectTypeOf(useQuery(suspenseQuery(options)).data).toEqualTypeOf<{
      title: string
    }>()
    const title = useQuery(
      suspenseQuery({ ...options, select: [select, (post) => post.title] }),
    )
    expectTypeOf(title.data).toEqualTypeOf<string>()
    const maybeFetch = Math.random() > 0.5 ? options.queryFn : skipToken
    expectTypeOf(
      useQuery(suspenseQuery({ ...options, queryFn: maybeFetch })).data,
    ).toEqualTypeOf<{ title: string } | undefined>()
    // @ts-expect-error Suspense manages whether the query runs.
    suspenseQuery({ ...options, enabled: false })
  })

  it('preserves page data, controls and selection in both infinite modes', () => {
    const options = infiniteQuery({
      queryKey: ['pages'],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return String(pageParam)
      },
      getNextPageParam: (_last, pages) => pages.length,
    })
    const regular = useQuery(options)
    expectTypeOf(regular.data).toEqualTypeOf<
      InfiniteData<string, number> | undefined
    >()
    expectTypeOf(regular.hasNextPage).toEqualTypeOf<boolean>()
    const suspended = useQuery(suspenseQuery(options))
    expectTypeOf(suspended.data).toEqualTypeOf<InfiniteData<string, number>>()
    expectTypeOf(suspended.fetchNextPage).toEqualTypeOf<
      typeof regular.fetchNextPage
    >()
    const selected = useQuery(
      suspenseQuery(
        infiniteQuery({
          ...options,
          select: [select, (pages) => pages.pages.join(',')],
        }),
      ),
    )
    expectTypeOf(selected.data).toEqualTypeOf<string>()
  })
})
