import { placeholderData, select } from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { skipToken, useSuspenseQueries } from '..'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof, SuspenseQueriesOptions } from '..'
import type { UseQueryOptions, UseSuspenseQueryResult } from '../types'

describe('UseSuspenseQueries config object overload', () => {
  it('should allow placeholderData without previous query information', () => {
    const queries: SuspenseQueriesOptions<[{ queryFnData: number }]> = [
      {
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        placeholderData: [
          placeholderData,
          (previousData, previousQuery) => {
            expectTypeOf(previousData).toEqualTypeOf<undefined>()
            expectTypeOf(previousQuery).toEqualTypeOf<undefined>()
            return 0
          },
        ],
      },
    ]
    const [query] = useSuspenseQueries({ queries })

    expectTypeOf(query.data).toEqualTypeOf<number>()
    expectTypeOf(query.isPlaceholderData).toEqualTypeOf<boolean>()

    const selectedOptions = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      placeholderData: placeholderData(0),
      select: [select, (data) => data.toString()],
    })
    const [selectedQuery] = useSuspenseQueries({
      queries: [selectedOptions],
    })

    expectTypeOf(selectedQuery.data).toEqualTypeOf<string>()
  })

  it('should always define TData', () => {
    const query1 = {
      queryKey: createKey(),
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
      queryKey: createKey(),
      queryFn: () => 'Query Data',
    }

    const queryResults = useSuspenseQueries({ queries: [query1, query2] })

    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean }>()
    expectTypeOf(query2Data).toEqualTypeOf<string>()
  })

  it('should define TData when passed through queryOptions', () => {
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => {
        return {
          wow: true,
        }
      },
    })
    const queryResults = useSuspenseQueries({ queries: [options] })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
    const query1 = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      select: [select, (data) => data > 1],
    })

    const query2 = {
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      select: [select, (data: number) => data > 1] as const,
    }

    const queryResults = useSuspenseQueries({ queries: [query1, query2] })
    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<boolean>()
    expectTypeOf(query2Data).toEqualTypeOf<boolean>()
  })

  it('should not have undefined in the TData union when initialData is provided as a function which can return undefined', () => {
    const queryResults = useSuspenseQueries({
      queries: [
        {
          queryKey: createKey(),
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        },
      ],
    })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      useSuspenseQueries({
        queries: [
          {
            queryKey: createKey(),
            // @ts-expect-error
            queryFn: skipToken,
          },
        ],
      }),
    )

    assertType(
      useSuspenseQueries({
        queries: [
          {
            queryKey: createKey(),
            // @ts-expect-error
            queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
          },
        ],
      }),
    )
  })

  it('should have correct TData type when conditional skipToken is passed', () => {
    const queryResults = useSuspenseQueries({
      queries: [
        {
          queryKey: createKey(),
          // @ts-expect-error
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    })

    const firstResult = queryResults[0]

    expectTypeOf(firstResult).toEqualTypeOf<
      UseSuspenseQueryResult<number, Error>
    >()
    expectTypeOf(firstResult.data).toEqualTypeOf<number>()
  })

  describe('custom hook', () => {
    it('should allow custom hooks using UseQueryOptions', () => {
      type Data = string

      const useCustomQueries = (
        options?: OmitKeyof<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) => {
        return useSuspenseQueries({
          queries: [
            {
              ...options,
              queryKey: createKey(),
              queryFn: () => Promise.resolve('data'),
            },
          ],
        })
      }

      const queryResults = useCustomQueries()
      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<Data>()
    })
  })

  it('should return correct data for dynamic queries with mixed result types', () => {
    const Queries1 = {
      get: () =>
        queryOptions({
          queryKey: createKey(),
          queryFn: () => Promise.resolve(1),
        }),
    }
    const Queries2 = {
      get: () =>
        queryOptions({
          queryKey: createKey(),
          queryFn: () => Promise.resolve(true),
        }),
    }

    const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
    const result = useSuspenseQueries({
      queries: [
        ...queries1List,
        {
          ...Queries2.get(),
          select: [
            select,
            function (data: boolean) {
              return data
            },
          ],
        },
      ],
    })

    expectTypeOf(result).toEqualTypeOf<
      [
        ...Array<UseSuspenseQueryResult<number, Error>>,
        UseSuspenseQueryResult<boolean, Error>,
      ]
    >()
  })

  it('should work with queryOptions with initialData on useSuspenseQueries', () => {
    const query1 = queryOptions({
      queryKey: createKey(),
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    })

    const queryResults = useSuspenseQueries({ queries: [query1] })
    const query1Data = queryResults[0].data

    expectTypeOf(query1Data).toEqualTypeOf<string>()
  })

  it('should not work with queryOptions with skipToken in queryFn on useSuspenseQueries', () => {
    assertType(
      useSuspenseQueries({
        queries: [
          // @ts-expect-error
          queryOptions({
            queryKey: createKey(),
            queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
          }),
        ],
      }),
    )

    assertType(
      useSuspenseQueries({
        queries: [
          // @ts-expect-error
          queryOptions({
            queryKey: createKey(),
            queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
            initialData: 5,
          }),
        ],
      }),
    )
  })

  it('should not show type error when using rest queryOptions', () => {
    assertType(
      useSuspenseQueries({
        queries: [
          {
            ...queryOptions({
              queryKey: createKey(),
              queryFn: () => 'Query Data',
            }),
            select: [
              select,
              function (data: string) {
                return data
              },
            ],
          },
        ],
      }),
    )
  })
})
