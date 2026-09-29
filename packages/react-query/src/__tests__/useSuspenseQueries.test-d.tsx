import { assertType, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { skipToken, useSuspenseQueries } from '..'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof } from '..'
import type { UseQueryOptions, UseSuspenseQueryResult } from '../types'

describe('UseSuspenseQueries config object overload', () => {
  it('TData should always be defined', () => {
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
    }

    const queryResults = useSuspenseQueries({ queries: [query1, query2] })

    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean }>()
    expectTypeOf(query2Data).toEqualTypeOf<string>()
  })

  it('TData should be defined when passed through queryOptions', () => {
    const options = queryOptions({
      queryKey: queryKey(),
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
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      select: (data) => data > 1,
    })

    const query2 = {
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      select: (data: number) => data > 1,
    }

    const queryResults = useSuspenseQueries({ queries: [query1, query2] })
    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<boolean>()
    expectTypeOf(query2Data).toEqualTypeOf<boolean>()
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const queryResults = useSuspenseQueries({
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
    })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      useSuspenseQueries({
        queries: [
          {
            queryKey: queryKey(),
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
            queryKey: queryKey(),
            // @ts-expect-error
            queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
          },
        ],
      }),
    )
  })

  it('TData should have correct type when conditional skipToken is passed', () => {
    const queryResults = useSuspenseQueries({
      queries: [
        {
          queryKey: queryKey(),
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
              queryKey: queryKey(),
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
    const result = useSuspenseQueries({
      queries: [
        ...queries1List,
        {
          ...Queries2.get(),
          select(data: boolean) {
            return data
          },
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

  it('queryOptions with initialData works on useSuspenseQueries', () => {
    const query1 = queryOptions({
      queryKey: queryKey(),
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    })

    const queryResults = useSuspenseQueries({ queries: [query1] })
    const query1Data = queryResults[0].data

    expectTypeOf(query1Data).toEqualTypeOf<string>()
  })

  it('queryOptions with skipToken in queryFn should not work on useSuspenseQueries', () => {
    assertType(
      useSuspenseQueries({
        queries: [
          // @ts-expect-error
          queryOptions({
            queryKey: queryKey(),
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
            queryKey: queryKey(),
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
              queryKey: queryKey(),
              queryFn: () => 'Query Data',
            }),
            select(data: string) {
              return data
            },
          },
        ],
      }),
    )
  })

  describe('select', () => {
    // Inferring the `select` argument of an *inline* query object from its
    // sibling `queryFn` is a known TypeScript limitation, because
    // `useSuspenseQueries` infers its array generic from the argument itself.
    // The two supported workarounds are to annotate the `select` parameter, or
    // to define the query with the `queryOptions` helper.
    // https://github.com/TanStack/query/issues/6556

    describe('without queryOptions (inline query object)', () => {
      it('leaves the select argument as `unknown` without an annotation', () => {
        useSuspenseQueries({
          queries: [
            {
              queryKey: queryKey(),
              queryFn: () => Promise.resolve(1),
              select: (data) => {
                expectTypeOf(data).toBeUnknown()
                // @ts-expect-error `data` is `unknown`, not the expected `number`
                return data.toFixed()
              },
            },
          ],
        })
      })

      it('infers the result when the select parameter is annotated', () => {
        const queryResults = useSuspenseQueries({
          queries: [
            {
              queryKey: queryKey(),
              queryFn: () => Promise.resolve(1),
              select: (data: number) => data.toFixed(),
            },
          ],
        })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string>()
      })
    })

    describe('with queryOptions passed directly', () => {
      it('without select, infers the queryFn data as the result', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        const queryResults = useSuspenseQueries({ queries: [options] })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<number>()
      })

      it('with select, infers the select argument and the result', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => {
            expectTypeOf(data).toEqualTypeOf<number>()
            return data.toFixed()
          },
        })
        const queryResults = useSuspenseQueries({ queries: [options] })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string>()
      })

      it('infers select when a base queryOptions is re-wrapped with queryOptions', () => {
        const baseOptions = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        const queryResults = useSuspenseQueries({
          queries: [
            queryOptions({
              ...baseOptions,
              select: (data) => {
                expectTypeOf(data).toEqualTypeOf<number>()
                return data.toFixed()
              },
            }),
            baseOptions,
          ],
        })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string>()
        expectTypeOf(queryResults[1].data).toEqualTypeOf<number>()
      })

      it('infers an overriding select when a queryOptions with a select is re-wrapped with queryOptions', () => {
        const baseOptions = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => data + 1,
        })
        const queryResults = useSuspenseQueries({
          queries: [
            queryOptions({
              ...baseOptions,
              select: (data) => {
                expectTypeOf(data).toEqualTypeOf<number>()
                return data.toFixed()
              },
            }),
          ],
        })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string>()
      })
    })

    describe('with queryOptions spread into an inline query object', () => {
      it('without select in the factory, leaves an unannotated select untyped', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        useSuspenseQueries({
          queries: [
            {
              ...options,
              // @ts-expect-error Without an annotation the inline `select` parameter `data` implicitly has type `any`
              select: (data) => {
                expectTypeOf(data).toBeAny()
                return data
              },
            },
          ],
        })
      })

      it('without select in the factory, an annotated select compiles', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        const queryResults = useSuspenseQueries({
          queries: [{ ...options, select: (data: number) => data.toFixed() }],
        })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string>()
      })

      it('with select in the factory, leaves an unannotated overriding select untyped', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => data + 1,
        })
        useSuspenseQueries({
          queries: [
            {
              ...options,
              // @ts-expect-error Without an annotation the inline `select` parameter `data` implicitly has type `any`
              select: (data) => {
                expectTypeOf(data).toBeAny()
                return data
              },
            },
          ],
        })
      })

      it('with select in the factory, an annotated overriding select compiles', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => data + 1,
        })
        const queryResults = useSuspenseQueries({
          queries: [{ ...options, select: (data: number) => data.toFixed() }],
        })
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string>()
      })
    })
  })
})
