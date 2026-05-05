import { describe, expectTypeOf, it } from 'vitest'
import { skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { queryOptions, useQueries } from '..'
import { QueryClient } from '../QueryClient'
import type { OmitKeyof } from '@tanstack/query-core'
import type { UseQueryResult } from '..'
import type { QueryOptions } from '../types'

describe('useQueries', () => {
  it('TData should have undefined in the union even when initialData is provided as an object', () => {
    const query1 = {
      queryKey: queryKey(),
      queryFn: () => {
        return {
          wow: true,
        }
      },
      initialData: {
        wow: false,
      },
    }

    const query2 = {
      queryKey: queryKey(),
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    }

    const query3 = {
      queryKey: queryKey(),
      queryFn: () => 'Query Data',
    }

    const queryResults = useQueries(() => ({
      queries: [query1, query2, query3],
    }))

    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data
    const query3Data = queryResults[2].data

    expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean } | undefined>()
    expectTypeOf(query2Data).toEqualTypeOf<string | undefined>()
    expectTypeOf(query3Data).toEqualTypeOf<string | undefined>()
  })

  it('TData should have undefined in the union when passed through queryOptions', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => {
        return {
          wow: true,
        }
      },
      initialData: {
        wow: true,
      },
    })
    const queryResults = useQueries(() => ({ queries: [options] }))

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const queryResults = useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        },
      ],
    }))

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  it('should infer types from explicit object type parameter', () => {
    const queryResults = useQueries<
      [
        { queryFnData: number },
        { queryFnData: string; error: Error },
        { queryFnData: boolean; data: string },
      ]
    >(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(true),
          select: () => 'selected',
        },
      ],
    }))

    expectTypeOf(queryResults[0].data).toEqualTypeOf<number | undefined>()
    expectTypeOf(queryResults[1].data).toEqualTypeOf<string | undefined>()
    expectTypeOf(queryResults[1].error).toEqualTypeOf<Error | null>()
    expectTypeOf(queryResults[2].data).toEqualTypeOf<string | undefined>()
  })

  it('should infer types from explicit tuple type parameter', () => {
    const queryResults = useQueries<
      [[number], [string, Error], [boolean, Error, string]]
    >(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(true),
          select: () => 'selected',
        },
      ],
    }))

    expectTypeOf(queryResults[0].data).toEqualTypeOf<number | undefined>()
    expectTypeOf(queryResults[1].data).toEqualTypeOf<string | undefined>()
    expectTypeOf(queryResults[1].error).toEqualTypeOf<Error | null>()
    expectTypeOf(queryResults[2].data).toEqualTypeOf<string | undefined>()
  })

  it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQueries', () => {
    const query1 = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      select: (data) => data > 1,
    })

    const query2 = {
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      select: (data: number) => data > 1,
    }

    const queryResults = useQueries(() => ({ queries: [query1, query2] }))
    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(query2Data).toEqualTypeOf<boolean | undefined>()
  })

  describe('custom hook', () => {
    it('should allow custom hooks using QueryOptions', () => {
      type Data = string

      const useCustomQueries = (
        options?: OmitKeyof<QueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) => {
        return useQueries(() => ({
          queries: [
            {
              ...options,
              queryKey: queryKey(),
              queryFn: () => Promise.resolve('data'),
            },
          ],
        }))
      }

      const queryResults = useCustomQueries()
      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<Data | undefined>()
    })
  })

  it('should infer custom TError from throwOnError', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    const queryResults = useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          throwOnError: (_error: CustomError) => false,
        },
      ],
    }))

    expectTypeOf(queryResults[0].error).toEqualTypeOf<CustomError | null>()
  })

  it('TData should have correct type when conditional skipToken is passed', () => {
    const queryResults = useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    }))

    const firstResult = queryResults[0]

    expectTypeOf(firstResult).toEqualTypeOf<UseQueryResult<number, Error>>()
    expectTypeOf(firstResult.data).toEqualTypeOf<number | undefined>()
  })

  it('should return correct data for dynamic queries with mixed result types', () => {
    const Queries1 = {
      get: () =>
        queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        }),
    }
    const Queries2 = {
      get: () =>
        queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(true),
        }),
    }

    const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
    const result = useQueries(() => ({
      queries: [...queries1List, { ...Queries2.get() }],
    }))

    expectTypeOf(result).toEqualTypeOf<
      [...Array<UseQueryResult<number, Error>>, UseQueryResult<boolean, Error>]
    >()
  })

  it('should accept queryClient as second argument', () => {
    const queryClient = new QueryClient()

    const queryResults = useQueries(
      () => ({
        queries: [
          {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('data'),
          },
        ],
      }),
      () => queryClient,
    )

    expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
  })

  it('should infer correct types for combine callback parameter', () => {
    useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('hello'),
        },
      ],
      combine: (results) => {
        expectTypeOf(results[0]).toEqualTypeOf<UseQueryResult<number, Error>>()
        expectTypeOf(results[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
        return results
      },
    }))
  })
})
