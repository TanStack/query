import { describe, expectTypeOf, it } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { injectQuery, queryOptions } from '..'
import type { Signal } from '@angular/core'
import type { CreateQueryOptions, OmitKeyof, QueryFunction } from '..'

describe('injectQuery', () => {
  it('should return the correct types', () => {
    const key = queryKey()
    // unspecified query function should default to unknown
    const noQueryFn = injectQuery(() => ({
      queryKey: key,
    }))
    expectTypeOf(noQueryFn.data()).toEqualTypeOf<unknown>()
    expectTypeOf(noQueryFn.error()).toEqualTypeOf<Error | null>()

    // it should infer the result type from the query function
    const fromQueryFn = injectQuery(() => ({
      queryKey: key,
      queryFn: () => 'test',
    }))
    expectTypeOf(fromQueryFn.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromQueryFn.error()).toEqualTypeOf<Error | null>()

    // it should be possible to specify the result type
    const withResult = injectQuery<string>(() => ({
      queryKey: key,
      queryFn: () => 'test',
    }))
    expectTypeOf(withResult.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(withResult.error()).toEqualTypeOf<Error | null>()

    // it should be possible to specify the error type
    type CustomErrorType = { message: string }
    const withError = injectQuery<string, CustomErrorType>(() => ({
      queryKey: key,
      queryFn: () => 'test',
    }))
    expectTypeOf(withError.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(withError.error()).toEqualTypeOf<CustomErrorType | null>()

    // it should infer the result type from the configuration
    const withResultInfer = injectQuery(() => ({
      queryKey: key,
      queryFn: () => true,
    }))
    expectTypeOf(withResultInfer.data()).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(withResultInfer.error()).toEqualTypeOf<Error | null>()

    // it should be possible to specify a union type as result type
    const unionTypeSync = injectQuery(() => ({
      queryKey: key,
      queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
    }))
    expectTypeOf(unionTypeSync.data()).toEqualTypeOf<'a' | 'b' | undefined>()
    const unionTypeAsync = injectQuery<'a' | 'b'>(() => ({
      queryKey: key,
      queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
    }))
    expectTypeOf(unionTypeAsync.data()).toEqualTypeOf<'a' | 'b' | undefined>()

    // it should error when the query function result does not match with the specified type
    // @ts-expect-error
    injectQuery<number>(() => ({ queryKey: key, queryFn: () => 'test' }))

    // it should infer the result type from a generic query function
    /**
     *
     */
    function queryFn<T = string>(): Promise<T> {
      return Promise.resolve({} as T)
    }

    const fromGenericQueryFn = injectQuery(() => ({
      queryKey: key,
      queryFn: () => queryFn(),
    }))
    expectTypeOf(fromGenericQueryFn.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromGenericQueryFn.error()).toEqualTypeOf<Error | null>()

    type MyData = number
    type MyQueryKey = readonly ['my-data', number]

    const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = ({
      queryKey: [, n],
    }) => {
      return n + 42
    }

    const fromMyDataArrayKeyQueryFn = injectQuery(() => ({
      queryKey: ['my-data', 100] as const,
      queryFn: getMyDataArrayKey,
    }))
    expectTypeOf(fromMyDataArrayKeyQueryFn.data()).toEqualTypeOf<
      number | undefined
    >()

    // it should handle query-functions that return Promise<any>
    const fromPromiseAnyQueryFn = injectQuery(() => ({
      queryKey: key,
      queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
    }))
    expectTypeOf(fromPromiseAnyQueryFn.data()).toEqualTypeOf<any | undefined>()

    const getMyDataStringKey: QueryFunction<MyData, ['1']> = (context) => {
      expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
      return Number(context.queryKey[0]) + 42
    }

    const fromGetMyDataStringKeyQueryFn = injectQuery(() => ({
      queryKey: ['1'] as ['1'],
      queryFn: getMyDataStringKey,
    }))
    expectTypeOf(fromGetMyDataStringKeyQueryFn.data()).toEqualTypeOf<
      number | undefined
    >()

    // handles wrapped queries with custom fetcher passed as inline queryFn
    const createWrappedQuery = <
      TQueryKey extends [string, Record<string, unknown>?],
      TQueryFnData,
      TError,
      TData = TQueryFnData,
    >(
      qk: TQueryKey,
      fetcher: (
        obj: TQueryKey[1],
        token: string,
        // return type must be wrapped with TQueryFnReturn
      ) => Promise<TQueryFnData>,
      options?: OmitKeyof<
        CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
        'queryKey' | 'queryFn' | 'initialData',
        'safely'
      >,
    ) =>
      injectQuery(() => ({
        queryKey: qk,
        queryFn: () => fetcher(qk[1], 'token'),
        ...options,
      }))
    const fromWrappedQuery = createWrappedQuery([''], () =>
      Promise.resolve('1'),
    )
    expectTypeOf(fromWrappedQuery.data()).toEqualTypeOf<string | undefined>()

    // handles wrapped queries with custom fetcher passed directly to createQuery
    const createWrappedFuncStyleQuery = <
      TQueryKey extends [string, Record<string, unknown>?],
      TQueryFnData,
      TError,
      TData = TQueryFnData,
    >(
      qk: TQueryKey,
      fetcher: () => Promise<TQueryFnData>,
      options?: OmitKeyof<
        CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
        'queryKey' | 'queryFn' | 'initialData',
        'safely'
      >,
    ) => injectQuery(() => ({ queryKey: qk, queryFn: fetcher, ...options }))
    const fromWrappedFuncStyleQuery = createWrappedFuncStyleQuery([''], () =>
      Promise.resolve(true),
    )
    expectTypeOf(fromWrappedFuncStyleQuery.data()).toEqualTypeOf<
      boolean | undefined
    >()
  })

  describe('initialData', () => {
    describe('Config object overload', () => {
      it('TData should always be defined when initialData is provided as an object', () => {
        const key = queryKey()
        const { data } = injectQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean }>>()
      })

      it('TData should be defined when passed through queryOptions', () => {
        const key = queryKey()
        const options = () =>
          queryOptions({
            queryKey: key,
            queryFn: () => {
              return {
                wow: true,
              }
            },
            initialData: {
              wow: true,
            },
          })
        const { data } = injectQuery(options)

        expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean }>>()
      })

      it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
        const key = queryKey()
        const options = queryOptions({
          queryKey: key,
          queryFn: () => Promise.resolve(1),
        })

        const query = injectQuery(() => ({
          ...options,
          select: (data) => data > 1,
        }))

        expectTypeOf(query.data).toEqualTypeOf<Signal<boolean | undefined>>()
      })

      it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
        const key = queryKey()
        const { data } = injectQuery(() => ({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => ({
            wow: true,
          }),
        }))

        expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean }>>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const key = queryKey()
        const { data } = injectQuery(() => ({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
        }))

        expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean } | undefined>>()
      })

      it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
        const key = queryKey()
        const { data } = injectQuery(() => ({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        }))

        expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean } | undefined>>()
      })

      it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
        const key = queryKey()
        const query = injectQuery(() => ({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        }))

        if (query.isSuccess()) {
          expectTypeOf(query.data).toEqualTypeOf<Signal<{ wow: boolean }>>()
        }
      })
    })

    describe('structuralSharing', () => {
      it('should be able to use structuralSharing with unknown types', () => {
        const key = queryKey()
        // https://github.com/TanStack/query/issues/6525#issuecomment-1938411343
        injectQuery(() => ({
          queryKey: key,
          queryFn: () => 5,
          structuralSharing: (oldData, newData) => {
            expectTypeOf(oldData).toBeUnknown()
            expectTypeOf(newData).toBeUnknown()
            return newData
          },
        }))
      })
    })
  })

  describe('Discriminated union return type', () => {
    it('data should be possibly undefined by default', () => {
      const key = queryKey()
      const query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))

      expectTypeOf(query.data).toEqualTypeOf<Signal<string | undefined>>()
    })

    it('data should be defined when query is success', () => {
      const key = queryKey()
      const query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))

      if (query.isSuccess()) {
        expectTypeOf(query.data).toEqualTypeOf<Signal<string>>()
      }
    })

    it('error should be null when query is success', () => {
      const key = queryKey()
      const query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))

      if (query.isSuccess()) {
        expectTypeOf(query.error).toEqualTypeOf<Signal<null>>()
      }
    })

    it('data should be undefined when query is pending', () => {
      const key = queryKey()
      const query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))

      if (query.isPending()) {
        expectTypeOf(query.data).toEqualTypeOf<Signal<undefined>>()
      }
    })

    it('error should be defined when query is error', () => {
      const key = queryKey()
      const query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))

      if (query.isError()) {
        expectTypeOf(query.error).toEqualTypeOf<Signal<Error>>()
      }
    })
  })
})
