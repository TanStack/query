import { describe, expectTypeOf, it } from 'vitest'
import {
  InfiniteQueryObserver,
  QueryObserver,
  dataTagSymbol,
  infiniteQueryOptions,
  isLoadingError,
  isPending,
  isSuccess,
  queryOptions,
  select,
  skipToken,
  suspenseInfiniteQueryOptions,
  suspenseQueryOptions,
  throwOnError,
  useQuery,
} from '..'
import type { InfiniteData, PreparedQuery } from '..'

describe('query render modes', () => {
  it('infers the ordinary boundary predicate from the prepared query', () => {
    const options = queryOptions({
      queryKey: ['post'] as const,
      queryFn: () => ({ title: 'Dune' }),
      throwOnError: [
        throwOnError,
        (error, query) => {
          expectTypeOf(error).toEqualTypeOf<Error>()
          expectTypeOf(query.state.data).toEqualTypeOf<
            { title: string } | undefined
          >()
          expectTypeOf(query.queryKey).toEqualTypeOf<readonly ['post']>()
          return query.state.data === undefined
        },
      ],
    })
    expectTypeOf(useQuery(options).data).toEqualTypeOf<
      { title: string } | undefined
    >()
    // @ts-expect-error A regular reader opts in with the imported error policy.
    queryOptions({ ...options, throwOnError: true })
  })

  it('infers data for each render mode from the same query', () => {
    const options = { queryKey: ['post'], queryFn: () => ({ title: 'Dune' }) }
    expectTypeOf(useQuery(queryOptions(options)).data).toEqualTypeOf<
      { title: string } | undefined
    >()
    expectTypeOf(useQuery(suspenseQueryOptions(options)).data).toEqualTypeOf<{
      title: string
    }>()
    // @ts-expect-error The observer must be selected by a factory.
    useQuery(options)
    // @ts-expect-error Inline options also require a factory.
    useQuery({ queryKey: ['post'], queryFn: () => 'Dune' })
    const lookalike = { ...options, Observer: QueryObserver }
    // @ts-expect-error Hand-writing the observer property does not create a descriptor.
    useQuery(lookalike)
    const copied = { ...queryOptions(options), staleTime: 1000 }
    expectTypeOf(useQuery(copied).data).toEqualTypeOf<
      { title: string } | undefined
    >()
    const disabled = queryOptions<number>({
      queryKey: ['disabled'],
      queryFn: () => 7,
      enabled: false,
    })
    expectTypeOf(useQuery(disabled).data).toEqualTypeOf<number | undefined>()
    // @ts-expect-error A prepared disabled query cannot be converted into a running Suspense reader.
    suspenseQueryOptions(disabled)
    const scheduled = suspenseQueryOptions(options)
    expectTypeOf(scheduled.enabled).toEqualTypeOf<true>()
    const seeded = queryOptions({
      ...options,
      initialData: { title: 'Seed' },
      select: select((post) => post.title),
    })
    expectTypeOf(useQuery(seeded).data).toEqualTypeOf<string>()
    const conflicting = { ...options, throwOnError: true }
    // @ts-expect-error Suspense owns throwOnError even when options come from a variable.
    suspenseQueryOptions(conflicting)
    const title = useQuery(
      suspenseQueryOptions({
        ...options,
        select: select((post) => post.title),
      }),
    )
    expectTypeOf(title.data).toEqualTypeOf<string>()
    const maybeFetch = Math.random() > 0.5 ? options.queryFn : skipToken
    expectTypeOf(
      useQuery(suspenseQueryOptions({ ...options, queryFn: maybeFetch })).data,
    ).toEqualTypeOf<{ title: string } | undefined>()
    // @ts-expect-error Suspense manages whether the query runs.
    suspenseQueryOptions({ ...options, enabled: false })
  })

  it('infers data returned by a chained promise', () => {
    const ready = Promise.resolve()
    const result = useQuery(
      queryOptions({
        queryKey: ['post'],
        queryFn: () => ready.then(() => 'fetched'),
      }),
    )
    expectTypeOf(result.data).toEqualTypeOf<string | undefined>()
  })

  it('can read a descriptor with erased data types', () => {
    function usePrepared(options: PreparedQuery) {
      const result = useQuery(options)
      expectTypeOf(result.data).toEqualTypeOf<unknown>()
      return result
    }
    expectTypeOf(usePrepared).toBeFunction()
  })

  it('accepts a fetcher that always rejects', () => {
    const input = {
      queryKey: ['broken'],
      queryFn: () => Promise.reject(new Error('broken')),
    }
    const regular = useQuery(queryOptions(input))
    const suspended = useQuery(suspenseQueryOptions(input))
    expectTypeOf(regular.data).toEqualTypeOf<undefined>()
    expectTypeOf(suspended.data).toEqualTypeOf<never>()
    expectTypeOf(suspended.error).toEqualTypeOf<Error | null>()
  })

  it('narrows the hook result from its status and retains undefined in selected data', () => {
    const result = useQuery(
      queryOptions({
        queryKey: ['post'],
        queryFn: () => ({ title: 'Dune' }),
      }),
    )
    // @ts-expect-error Query status flags are imported as predicates.
    result.isPending
    if (isPending(result)) {
      expectTypeOf(result.data).toEqualTypeOf<undefined>()
    } else if (isLoadingError(result)) {
      expectTypeOf(result.error).toEqualTypeOf<Error>()
    } else {
      expectTypeOf(result.data).toEqualTypeOf<{ title: string }>()
    }

    const selected = useQuery(
      queryOptions({
        queryKey: ['books'],
        queryFn: (): Array<string> => [],
        select: select((titles) => titles.at(0)),
      }),
    )
    if (isSuccess(selected)) {
      expectTypeOf(selected.data).toEqualTypeOf<string | undefined>()
    }
  })

  it('infers the raw page and cursor inside one suspense factory call', () => {
    const lookalike = {
      queryKey: ['pages'],
      queryFn: () => 'page',
      initialPageParam: 0,
      getNextPageParam: () => 1,
      Observer: InfiniteQueryObserver,
    }
    // @ts-expect-error A raw object cannot select an infinite observer by hand either.
    useQuery(lookalike)
    const descriptor = suspenseInfiniteQueryOptions({
      queryKey: ['archive'],
      initialPageParam: { cursor: 0 },
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<{ cursor: number }>()
        return [pageParam.cursor.toString()]
      },
      getNextPageParam: (_lastPage, pages) => ({ cursor: pages.length }),
      select: select((data) => {
        expectTypeOf(data).toEqualTypeOf<
          InfiniteData<Array<string>, { cursor: number }>
        >()
        return data.pages.flat().join(',')
      }),
    })
    expectTypeOf(descriptor.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<Array<string>, { cursor: number }>
    >()
    expectTypeOf(useQuery(descriptor).data).toEqualTypeOf<string>()
  })

  it('preserves page data, controls and selection in both infinite modes', () => {
    const options = infiniteQueryOptions({
      queryKey: ['pages'],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return String(pageParam)
      },
      getNextPageParam: (_last, pages) => pages.length,
    })
    // @ts-expect-error Suspense owns the error boundary policy for either kind of observer.
    suspenseInfiniteQueryOptions({ ...options, throwOnError: false })
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<string, number>
    >()
    const explicit = infiniteQueryOptions<
      string,
      TypeError,
      number,
      readonly ['pages'],
      number
    >({
      queryKey: ['pages'],
      queryFn: ({ pageParam }) => String(pageParam),
      initialPageParam: 0,
      getNextPageParam: () => 1,
      select: select((data) => data.pages.length),
    })
    expectTypeOf(
      useQuery(suspenseInfiniteQueryOptions(explicit)).error,
    ).toEqualTypeOf<TypeError | null>()
    expectTypeOf(useQuery(explicit).data).toEqualTypeOf<number | undefined>()
    const skipped = suspenseInfiniteQueryOptions({
      ...options,
      queryFn: Math.random() > 0.5 ? skipToken : () => 'page',
    })
    expectTypeOf(skipped.enabled).toEqualTypeOf<boolean>()
    expectTypeOf(useQuery(skipped).data).toEqualTypeOf<
      InfiniteData<string, number> | undefined
    >()
    const regular = useQuery(options)
    expectTypeOf(regular.data).toEqualTypeOf<
      InfiniteData<string, number> | undefined
    >()
    expectTypeOf(regular.hasNextPage).toEqualTypeOf<boolean>()
    const suspended = useQuery(suspenseInfiniteQueryOptions(options))
    expectTypeOf(suspended.data).toEqualTypeOf<InfiniteData<string, number>>()
    expectTypeOf(suspended.fetchNextPage).toEqualTypeOf<
      typeof regular.fetchNextPage
    >()
    const selected = useQuery(
      suspenseInfiniteQueryOptions({
        ...options,
        select: select((pages) => pages.pages.join(',')),
      }),
    )
    expectTypeOf(selected.data).toEqualTypeOf<string>()
  })
})
