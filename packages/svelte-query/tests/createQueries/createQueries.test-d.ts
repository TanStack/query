import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { createQueries, queryOptions } from '../../src/index.js'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  skipToken,
} from '../../src/index.js'

describe('createQueries', () => {
  it('should return correct data for dynamic queries with mixed result types', () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const Queries1 = {
      get: () =>
        queryOptions({
          queryKey: key1,
          queryFn: () => Promise.resolve(1),
        }),
    }
    const Queries2 = {
      get: () =>
        queryOptions({
          queryKey: key2,
          queryFn: () => Promise.resolve(true),
        }),
    }

    const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
    const result = createQueries(() => ({
      queries: [...queries1List, { ...Queries2.get() }],
    }))

    expectTypeOf(result).toEqualTypeOf<
      [
        ...Array<CreateQueryResult<number, Error>>,
        CreateQueryResult<boolean, Error>,
      ]
    >()
  })

  it('should handle type parameter - tuple of tuples', () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

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

    expectTypeOf(result1[0]).toEqualTypeOf<CreateQueryResult<number, unknown>>()
    expectTypeOf(result1[1]).toEqualTypeOf<CreateQueryResult<string, unknown>>()
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

    expectTypeOf(result2[0]).toEqualTypeOf<CreateQueryResult<string, unknown>>()
    expectTypeOf(result2[1]).toEqualTypeOf<CreateQueryResult<number, unknown>>()
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
  })

  it('should handle type parameter - tuple of objects', () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

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

    expectTypeOf(result1[0]).toEqualTypeOf<CreateQueryResult<number, unknown>>()
    expectTypeOf(result1[1]).toEqualTypeOf<CreateQueryResult<string, unknown>>()
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

    expectTypeOf(result2[0]).toEqualTypeOf<CreateQueryResult<string, unknown>>()
    expectTypeOf(result2[1]).toEqualTypeOf<CreateQueryResult<number, unknown>>()
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

    expectTypeOf(result3[0]).toEqualTypeOf<CreateQueryResult<string, unknown>>()
    expectTypeOf(result3[1]).toEqualTypeOf<CreateQueryResult<number, unknown>>()
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
  })

  it('should handle array literal without type parameter to infer result type', () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()

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
  })

  it('should handle strongly typed queryFn factories and createQueries wrappers', () => {
    const queryClient = new QueryClient()

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
  })
})
