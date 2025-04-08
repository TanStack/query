import { QueryCache, QueryClient, createQueries } from '@tanstack/svelte-query'
import { promiseWithResolvers, withEffectRoot } from './utils.svelte'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  skipToken,
} from '@tanstack/svelte-query'

describe('createQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  beforeEach(() => {
    queryCache.clear()
  })

  it(
    'should return the correct states',
    withEffectRoot(async () => {
      const key1 = ['test-1']
      const key2 = ['test-2']
      const results: Array<Array<CreateQueryResult>> = []
      const { promise: promise1, resolve: resolve1 } = promiseWithResolvers()
      const { promise: promise2, resolve: resolve2 } = promiseWithResolvers()

      const result = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => promise1,
            },
            {
              queryKey: key2,
              queryFn: () => promise2,
            },
          ],
        }),
        () => queryClient,
      )

      $effect(() => {
        results.push([{ ...result[0] }, { ...result[1] }])
      })

      resolve1(1)

      await vi.waitFor(() => expect(result[0].data).toBe(1))

      resolve2(2)
      await vi.waitFor(() => expect(result[1].data).toBe(2))

      expect(results.length).toBe(3)
      expect(results[0]).toMatchObject([
        { data: undefined },
        { data: undefined },
      ])
      expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
      expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
    }),
  )

  it(
    'handles type parameter - tuple of tuples',
    withEffectRoot(() => {
      const key1 = ['test-key-1']
      const key2 = ['test-key-2']
      const key3 = ['test-key-3']

      const result1 = createQueries<
        [[number], [string], [Array<string>, boolean]]
      >(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 1,
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
            },
            {
              queryKey: key3,
              queryFn: () => ['string[]'],
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result1[0]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result1[1]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result1[2]).toEqualTypeOf<
        CreateQueryResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = createQueries<
        [[string, unknown, string], [string, unknown, number]]
      >(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return a.toLowerCase()
              },
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return parseInt(a)
              },
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result2[0]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result2[1]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      createQueries<[[string, unknown, string], [string, boolean, number]]>(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return a.toLowerCase()
              },
              placeholderData: 'string',
              // @ts-expect-error (initialData: string)
              initialData: 123,
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return parseInt(a)
              },
              placeholderData: 'string',
              // @ts-expect-error (initialData: string)
              initialData: 123,
            },
          ],
        }),
        () => queryClient,
      )

      // field names should be enforced
      createQueries<[[string]]>(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }),
        () => queryClient,
      )
    }),
  )

  it(
    'handles type parameter - tuple of objects',
    withEffectRoot(() => {
      const key1 = ['test-key-1']
      const key2 = ['test-key-2']
      const key3 = ['test-key-3']

      const result1 = createQueries<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: Array<string>; error: boolean },
        ]
      >(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 1,
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
            },
            {
              queryKey: key3,
              queryFn: () => ['string[]'],
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result1[0]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result1[1]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result1[2]).toEqualTypeOf<
        CreateQueryResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = createQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number },
        ]
      >(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return a.toLowerCase()
              },
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return parseInt(a)
              },
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result2[0]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result2[1]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = createQueries<[{ data: string }, { data: number }]>(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<unknown>()
                return a as string
              },
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<unknown>()
                return a as number
              },
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result3[0]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result3[1]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result3[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      createQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number; error: boolean },
        ]
      >(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return a.toLowerCase()
              },
              placeholderData: 'string',
              // @ts-expect-error (initialData: string)
              initialData: 123,
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return parseInt(a)
              },
              placeholderData: 'string',
              // @ts-expect-error (initialData: string)
              initialData: 123,
            },
          ],
        }),
        () => queryClient,
      )

      // field names should be enforced
      createQueries<[{ queryFnData: string }]>(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }),
        () => queryClient,
      )
    }),
  )

  it(
    'handles array literal without type parameter to infer result type',
    withEffectRoot(() => {
      const key1 = ['test-key-1']
      const key2 = ['test-key-2']
      const key3 = ['test-key-3']
      const key4 = ['test-key-4']

      // Array.map preserves TQueryFnData
      const result1 = createQueries(
        () => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
          })),
        }),
        () => queryClient,
      )

      expectTypeOf(result1).toEqualTypeOf<
        Array<CreateQueryResult<number, Error>>
      >()
      if (result1[0]) {
        expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      }

      // Array.map preserves TData
      const result2 = createQueries(
        () => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        }),
        () => queryClient,
      )

      expectTypeOf(result2).toEqualTypeOf<
        Array<CreateQueryResult<string, Error>>
      >()

      const result3 = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 1,
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
            },
            {
              queryKey: key3,
              queryFn: () => ['string[]'],
              select: () => 123,
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result3[0]).toEqualTypeOf<CreateQueryResult<number, Error>>()
      expectTypeOf(result3[1]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result3[2]).toEqualTypeOf<CreateQueryResult<number, Error>>()
      expectTypeOf(result3[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<string | undefined>()
      // select takes precedence over queryFn
      expectTypeOf(result3[2].data).toEqualTypeOf<number | undefined>()

      // initialData/placeholderData are enforced
      createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              placeholderData: 'string',
              // @ts-expect-error (initialData: string)
              initialData: 123,
            },
            {
              queryKey: key2,
              queryFn: () => 123,
              // @ts-expect-error (placeholderData: number)
              placeholderData: 'string',
              initialData: 123,
            },
          ],
        }),
        () => queryClient,
      )

      // select params are "indirectly" enforced
      createQueries(
        () => ({
          queries: [
            // unfortunately TS will not suggest the type for you
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
            // however you can add a type to the callback
            {
              queryKey: key2,
              queryFn: () => 'string',
            },
            // the type you do pass is enforced
            {
              queryKey: key3,
              queryFn: () => 'string',
            },
            {
              queryKey: key4,
              queryFn: () => 'string',
              select: (a: string) => parseInt(a),
            },
          ],
        }),
        () => queryClient,
      )

      // callbacks are also indirectly enforced with Array.map
      createQueries(
        () => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        }),
        () => queryClient,
      )

      // results inference works when all the handlers are defined
      const result4 = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
            {
              queryKey: key2,
              queryFn: () => 'string',
            },
            {
              queryKey: key4,
              queryFn: () => 'string',
              select: (a: string) => parseInt(a),
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result4[0]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result4[1]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result4[2]).toEqualTypeOf<CreateQueryResult<number, Error>>()

      // handles when queryFn returns a Promise
      const result5 = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => Promise.resolve('string'),
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result5[0]).toEqualTypeOf<CreateQueryResult<string, Error>>()

      // Array as const does not throw error
      const result6 = createQueries(
        () =>
          ({
            queries: [
              {
                queryKey: ['key1'],
                queryFn: () => 'string',
              },
              {
                queryKey: ['key1'],
                queryFn: () => 123,
              },
            ],
          }) as const,
        () => queryClient,
      )

      expectTypeOf(result6[0]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result6[1]).toEqualTypeOf<CreateQueryResult<number, Error>>()

      // field names should be enforced - array literal
      createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }),
        () => queryClient,
      )

      // field names should be enforced - Array.map() result
      createQueries(
        () => ({
          // @ts-expect-error (invalidField)
          queries: Array(10).map(() => ({
            someInvalidField: '',
          })),
        }),
        () => queryClient,
      )

      // supports queryFn using fetch() to return Promise<any> - Array.map() result
      createQueries(
        () => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () =>
              fetch('return Promise<any>').then((resp) => resp.json()),
          })),
        }),
        () => queryClient,
      )

      // supports queryFn using fetch() to return Promise<any> - array literal
      createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () =>
                fetch('return Promise<any>').then((resp) => resp.json()),
            },
          ],
        }),
        () => queryClient,
      )
    }),
  )

  it(
    'handles strongly typed queryFn factories and createQueries wrappers',
    withEffectRoot(() => {
      // QueryKey + queryFn factory
      type QueryKeyA = ['queryA']
      const getQueryKeyA = (): QueryKeyA => ['queryA']
      type GetQueryFunctionA = () => QueryFunction<number, QueryKeyA>
      const getQueryFunctionA: GetQueryFunctionA = () => () => {
        return 1
      }
      type SelectorA = (data: number) => [number, string]
      const getSelectorA = (): SelectorA => (data) => [data, data.toString()]

      type QueryKeyB = ['queryB', string]
      const getQueryKeyB = (id: string): QueryKeyB => ['queryB', id]
      type GetQueryFunctionB = () => QueryFunction<string, QueryKeyB>
      const getQueryFunctionB: GetQueryFunctionB = () => () => {
        return '1'
      }
      type SelectorB = (data: string) => [string, number]
      const getSelectorB = (): SelectorB => (data) => [data, +data]

      // Wrapper with strongly typed array-parameter
      function useWrappedQueries<
        TQueryFnData,
        TError,
        TData,
        TQueryKey extends QueryKey,
      >(
        queries: Array<
          CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
        >,
      ) {
        return createQueries(
          () => ({
            queries: queries.map(
              // no need to type the mapped query
              (query) => {
                const { queryFn: fn, queryKey: key } = query
                expectTypeOf(fn).toEqualTypeOf<
                  | typeof skipToken
                  | QueryFunction<TQueryFnData, TQueryKey, never>
                  | undefined
                >()
                return {
                  queryKey: key,
                  queryFn: fn
                    ? (ctx: QueryFunctionContext<TQueryKey>) => {
                        // eslint-disable-next-line vitest/valid-expect
                        expectTypeOf<TQueryKey>(ctx.queryKey)
                        return (
                          fn as QueryFunction<TQueryFnData, TQueryKey>
                        ).call({}, ctx)
                      }
                    : undefined,
                }
              },
            ),
          }),
          () => queryClient,
        )
      }

      const result = createQueries(
        () => ({
          queries: [
            {
              queryKey: getQueryKeyA(),
              queryFn: getQueryFunctionA(),
            },
            {
              queryKey: getQueryKeyB('id'),
              queryFn: getQueryFunctionB(),
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(result[0]).toEqualTypeOf<CreateQueryResult<number, Error>>()
      expectTypeOf(result[1]).toEqualTypeOf<CreateQueryResult<string, Error>>()

      const withSelector = createQueries(
        () => ({
          queries: [
            {
              queryKey: getQueryKeyA(),
              queryFn: getQueryFunctionA(),
              select: getSelectorA(),
            },
            {
              queryKey: getQueryKeyB('id'),
              queryFn: getQueryFunctionB(),
              select: getSelectorB(),
            },
          ],
        }),
        () => queryClient,
      )

      expectTypeOf(withSelector[0]).toEqualTypeOf<
        CreateQueryResult<[number, string], Error>
      >()
      expectTypeOf(withSelector[1]).toEqualTypeOf<
        CreateQueryResult<[string, number], Error>
      >()

      const withWrappedQueries = useWrappedQueries(
        Array(10).map(() => ({
          queryKey: getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectTypeOf(withWrappedQueries).toEqualTypeOf<
        Array<CreateQueryResult<number, Error>>
      >()
    }),
  )

  it(
    'should track results',
    withEffectRoot(async () => {
      const key1 = ['test-track-results']
      const results: Array<Array<CreateQueryResult>> = []
      let count = 0

      const result = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => Promise.resolve(++count),
            },
          ],
        }),
        () => queryClient,
      )

      $effect(() => {
        results.push([result[0]])
      })

      await vi.waitFor(() => expect(result[0].data).toBe(1))

      expect(results.length).toBe(2)
      expect(results[0]).toMatchObject([{ data: undefined }])
      expect(results[1]).toMatchObject([{ data: 1 }])

      // Trigger refetch
      result[0].refetch()

      await vi.waitFor(() => expect(result[0].data).toBe(2))

      // Only one render for data update, no render for isFetching transition
      expect(results.length).toBe(3)
      expect(results[2]).toMatchObject([{ data: 2 }])
    }),
  )

  it(
    'should combine queries',
    withEffectRoot(async () => {
      const key1 = ['test-combine-1']
      const key2 = ['test-combine-2']

      const { promise: promise1, resolve: resolve1 } =
        promiseWithResolvers<string>()
      const { promise: promise2, resolve: resolve2 } =
        promiseWithResolvers<string>()

      const queries = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => promise1,
            },
            {
              queryKey: key2,
              queryFn: () => promise2,
            },
          ],
          combine: (results) => {
            return {
              combined: true,
              res: results
                .flatMap((res) => (res.data ? [res.data] : []))
                .join(','),
            }
          },
        }),
        () => queryClient,
      )

      // Initially both queries are loading
      expect(queries).toEqual({
        combined: true,
        res: '',
      })

      // Resolve the first query
      resolve1('first result')
      await vi.waitFor(() => expect(queries.res).toBe('first result'))

      // Resolve the second query
      resolve2('second result')
      await vi.waitFor(() =>
        expect(queries.res).toBe('first result,second result'),
      )

      expect(queries).toEqual({
        combined: true,
        res: 'first result,second result',
      })
    }),
  )

  it(
    'should track property access through combine function',
    withEffectRoot(async () => {
      const key1 = ['test-track-combine-1']
      const key2 = ['test-track-combine-2']
      let count = 0
      const results: Array<unknown> = []

      const { promise: promise1, resolve: resolve1 } =
        promiseWithResolvers<string>()
      const { promise: promise2, resolve: resolve2 } =
        promiseWithResolvers<string>()
      const { promise: promise3, resolve: resolve3 } =
        promiseWithResolvers<string>()
      const { promise: promise4, resolve: resolve4 } =
        promiseWithResolvers<string>()

      const queries = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => (count === 0 ? promise1 : promise3),
            },
            {
              queryKey: key2,
              queryFn: () => (count === 0 ? promise2 : promise4),
            },
          ],
          combine: (queryResults) => {
            return {
              combined: true,
              refetch: () =>
                Promise.all(queryResults.map((res) => res.refetch())),
              res: queryResults
                .flatMap((res) => (res.data ? [res.data] : []))
                .join(','),
            }
          },
        }),
        () => queryClient,
      )

      $effect(() => {
        results.push({ ...queries })
      })

      // Initially both queries are loading
      await vi.waitFor(() =>
        expect(results[0]).toStrictEqual({
          combined: true,
          refetch: expect.any(Function),
          res: '',
        }),
      )

      // Resolve the first query
      resolve1('first result ' + count)
      await vi.waitFor(() => expect(queries.res).toBe('first result 0'))

      expect(results[1]).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: 'first result 0',
      })

      // Resolve the second query
      resolve2('second result ' + count)
      await vi.waitFor(() =>
        expect(queries.res).toBe('first result 0,second result 0'),
      )

      expect(results[2]).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: 'first result 0,second result 0',
      })

      // Increment count and refetch
      count++
      queries.refetch()

      // Resolve the refetched queries
      resolve3('first result ' + count)
      resolve4('second result ' + count)

      await vi.waitFor(() =>
        expect(queries.res).toBe('first result 1,second result 1'),
      )

      const length = results.length
      expect(results.at(-1)).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: 'first result 1,second result 1',
      })

      // Refetch again but with the same data
      await queries.refetch()

      // No further re-render because data didn't change
      expect(results.length).toBe(length)
    }),
  )
})
