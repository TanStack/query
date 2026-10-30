import { assertType, describe, expectTypeOf, it } from 'vitest'
import { createKey } from '@tanstack/query-test-utils'
import { queryOptions, useQuery } from '../index'
import type { OmitKeyof, QueryFunction, UseQueryOptions } from '..'

describe('useQuery', () => {
  const key = createKey()

  it('should default to unknown when the query function is unspecified', () => {
    const noQueryFn = useQuery(() => ({ queryKey: key }))
    expectTypeOf(noQueryFn.data).toEqualTypeOf<unknown>()
    expectTypeOf(noQueryFn.error).toEqualTypeOf<Error | null>()
  })

  it('should infer the result type from the query function', () => {
    const fromQueryFn = useQuery(() => ({
      queryKey: key,
      queryFn: () => 'test',
    }))
    expectTypeOf(fromQueryFn.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromQueryFn.error).toEqualTypeOf<Error | null>()
  })

  it('should be possible to specify the result type', () => {
    const withResult = useQuery<string>(() => ({
      queryKey: key,
      queryFn: () => 'test',
    }))
    expectTypeOf(withResult.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(withResult.error).toEqualTypeOf<Error | null>()
  })

  it('should be possible to specify the error type', () => {
    const withError = useQuery<string, Error>(() => ({
      queryKey: key,
      queryFn: () => 'test',
    }))
    expectTypeOf(withError.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(withError.error).toEqualTypeOf<Error | null>()
  })

  it('should provide the result type in the configuration', () => {
    const result = useQuery(() => ({
      queryKey: [key],
      queryFn: () => true,
    }))
    expectTypeOf(result.data).toEqualTypeOf<boolean | undefined>()
  })

  it('should be possible to specify a union type as result type', () => {
    const unionTypeSync = useQuery(() => ({
      queryKey: key,
      queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
    }))
    expectTypeOf(unionTypeSync.data).toEqualTypeOf<'a' | 'b' | undefined>()
    const unionTypeAsync = useQuery<'a' | 'b'>(() => ({
      queryKey: key,
      queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
    }))
    expectTypeOf(unionTypeAsync.data).toEqualTypeOf<'a' | 'b' | undefined>()
  })

  it('should error when the query function result does not match with the specified type', () => {
    assertType(
      useQuery<number>(() => ({
        queryKey: key,
        // @ts-expect-error
        queryFn: () => 'test',
      })),
    )
  })

  it('should infer the result type from a generic query function', () => {
    function queryFn<T = string>(): Promise<T> {
      return Promise.resolve({} as T)
    }

    const fromGenericQueryFn = useQuery(() => ({
      queryKey: key,
      queryFn: () => queryFn(),
    }))
    expectTypeOf(fromGenericQueryFn.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromGenericQueryFn.error).toEqualTypeOf<Error | null>()
  })

  it("should accept a query function typed with 'QueryFunction'", () => {
    type MyData = number
    type MyQueryKey = readonly ['my-data', number]

    const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = ({
      queryKey: [, n],
    }) => {
      return n + 42
    }

    useQuery(() => ({
      queryKey: ['my-data', 100] as const,
      queryFn: getMyDataArrayKey,
    }))

    const getMyDataStringKey: QueryFunction<MyData, ['1']> = (context) => {
      expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
      return Number(context.queryKey[0]) + 42
    }

    useQuery(() => ({
      queryKey: ['1'] as ['1'],
      queryFn: getMyDataStringKey,
    }))
  })

  it('should handle query functions that return Promise<any>', () => {
    const result = useQuery(() => ({
      queryKey: key,
      queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
    }))
    expectTypeOf(result.data).toEqualTypeOf<any>()
  })

  it('should handle wrapped queries with custom fetcher passed as inline queryFn', () => {
    const useWrappedQuery = <
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
        UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
        'queryKey' | 'queryFn' | 'initialData',
        'safely'
      >,
    ) =>
      useQuery(() => ({
        queryKey: qk,
        queryFn: () => fetcher(qk[1], 'token'),
        ...options,
      }))
    const test = useWrappedQuery([''], () => Promise.resolve('1'))
    expectTypeOf(test.data).toEqualTypeOf<string | undefined>()
  })

  it('should handle wrapped queries with custom fetcher passed directly to useQuery', () => {
    const useWrappedFuncStyleQuery = <
      TQueryKey extends [string, Record<string, unknown>?],
      TQueryFnData,
      TError,
      TData = TQueryFnData,
    >(
      qk: TQueryKey,
      fetcher: () => Promise<TQueryFnData>,
      options?: OmitKeyof<
        UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
        'queryKey' | 'queryFn' | 'initialData',
        'safely'
      >,
    ) => useQuery(() => ({ queryKey: qk, queryFn: fetcher, ...options }))
    const testFuncStyle = useWrappedFuncStyleQuery([''], () =>
      Promise.resolve(true),
    )
    expectTypeOf(testFuncStyle.data).toEqualTypeOf<boolean | undefined>()
  })

  it('should return the correct states for a successful query', () => {
    const state = useQuery<string, Error>(() => ({
      queryKey: key,
      queryFn: () => Promise.resolve('test'),
    }))

    if (state.isPending) {
      expectTypeOf(state.data).toEqualTypeOf<undefined>()
      expectTypeOf(state.error).toEqualTypeOf<null>()
    } else if (state.isLoadingError) {
      expectTypeOf(state.data).toEqualTypeOf<undefined>()
      expectTypeOf(state.error).toEqualTypeOf<Error>()
    } else {
      expectTypeOf(state.data).toEqualTypeOf<string>()
      expectTypeOf(state.error).toEqualTypeOf<Error | null>()
    }
  })

  describe('initialData', () => {
    describe('Config object overload', () => {
      it('should always define TData when initialData is provided as an object', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should define TData when passed through queryOptions', () => {
        const options = queryOptions({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        })
        const { data } = useQuery(() => options)

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should define TData when queryOptions is called inline in the accessor', () => {
        const { data } = useQuery(() =>
          queryOptions({
            queryKey: createKey(),
            queryFn: () => ({ wow: true }),
            initialData: { wow: true },
          }),
        )

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should always define TData when initialData is provided as a function which ALWAYS returns the data', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should have undefined in the TData union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('should have undefined in the TData union when queryOptions is called inline in the accessor without initialData', () => {
        const { data } = useQuery(() =>
          queryOptions({
            queryKey: createKey(),
            queryFn: () => ({ wow: true }),
          }),
        )

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('should have undefined in the TData union when initialData is provided as a function which can return undefined', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key overload', () => {
      it('should always define TData when initialData is provided', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should have undefined in the TData union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key and func', () => {
      it('should always define TData when initialData is provided', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should have undefined in the TData union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: createKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })
  })

  describe('reconcile', () => {
    it('should be able to use reconcile with unknown types', () => {
      useQuery(() => ({
        queryKey: createKey(),
        queryFn: () => ({ wow: true }),
        reconcile: (oldData, newData) => {
          expectTypeOf(oldData).toBeUnknown()
          expectTypeOf(newData).toBeUnknown()
          return newData
        },
      }))
    })

    it('should infer TData from select when reconcile is defined before select', () => {
      const { data } = useQuery(() => ({
        queryKey: createKey(),
        queryFn: () => ({ wow: true }),
        reconcile: (oldData, newData) => oldData ?? newData,
        select: (data) => data.wow,
      }))

      expectTypeOf(data).toEqualTypeOf<boolean | undefined>()
    })

    it('should infer TData from select when spreading the result of queryOptions', () => {
      const options = queryOptions({
        queryKey: createKey(),
        queryFn: () => ({ wow: true }),
      })
      const { data } = useQuery(() => ({
        ...options,
        select: (data) => data.wow,
      }))

      expectTypeOf(data).toEqualTypeOf<boolean | undefined>()
    })
  })

  describe('generic indexed access TData', () => {
    // https://github.com/TanStack/query/issues/9937
    it('should be assignable back to its source indexed type when passed to a generic function parameter', () => {
      enum DataType {
        Account = 'account',
        Product = 'product',
      }

      interface Account {
        name: string
      }
      interface Product {
        code: string
      }

      type DataTypeToEntity = {
        [DataType.Account]: Account
        [DataType.Product]: Product
      }

      const getData = <TDataType extends DataType>(
        _dataType: TDataType,
      ): Promise<DataTypeToEntity[TDataType]> =>
        Promise.resolve({} as DataTypeToEntity[TDataType])

      const getLabel = <TDataType extends DataType>(
        _dataType: TDataType,
        _data: DataTypeToEntity[TDataType],
      ) => 'test'

      function Test<TDataType extends DataType>(props: {
        dataType: TDataType
      }) {
        const { data } = useQuery(() => ({
          queryKey: ['test'],
          queryFn: () => getData(props.dataType),
        }))

        // Regression guard: this call must compile. With the previous
        // hand-rolled NoInfer, `data` failed to flow back into the generic
        // indexed-access parameter `DataTypeToEntity[TDataType]`.
        return data ? getLabel(props.dataType, data) : null
      }

      expectTypeOf(Test).toBeFunction()
    })
  })
})
