import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { queryOptions, useQuery } from '../index'
import type { OmitKeyof, QueryFunction, UseQueryOptions } from '..'

describe('useQuery', () => {
  const key = queryKey()

  // unspecified query function should default to unknown
  const noQueryFn = useQuery(() => ({ queryKey: key }))
  expectTypeOf(noQueryFn.data).toEqualTypeOf<unknown>()
  expectTypeOf(noQueryFn.error).toEqualTypeOf<Error | null>()

  // it should infer the result type from the query function
  const fromQueryFn = useQuery(() => ({
    queryKey: key,
    queryFn: () => 'test',
  }))
  expectTypeOf(fromQueryFn.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(fromQueryFn.error).toEqualTypeOf<Error | null>()

  // it should be possible to specify the result type
  const withResult = useQuery<string>(() => ({
    queryKey: key,
    queryFn: () => 'test',
  }))
  expectTypeOf(withResult.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(withResult.error).toEqualTypeOf<Error | null>()

  // it should be possible to specify the error type
  const withError = useQuery<string, Error>(() => ({
    queryKey: key,
    queryFn: () => 'test',
  }))
  expectTypeOf(withError.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(withError.error).toEqualTypeOf<Error | null>()

  // it should provide the result type in the configuration
  useQuery(() => ({
    queryKey: [key],
    queryFn: () => true,
  }))

  // it should be possible to specify a union type as result type
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

  // should error when the query function result does not match with the specified type
  // @ts-expect-error
  useQuery<number>(() => ({ queryKey: key, queryFn: () => 'test' }))

  // it should infer the result type from a generic query function
  function queryFn<T = string>(): Promise<T> {
    return Promise.resolve({} as T)
  }

  const fromGenericQueryFn = useQuery(() => ({
    queryKey: key,
    queryFn: () => queryFn(),
  }))
  expectTypeOf(fromGenericQueryFn.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(fromGenericQueryFn.error).toEqualTypeOf<Error | null>()

  const fromGenericOptionsQueryFn = useQuery(() => ({
    queryKey: key,
    queryFn: () => queryFn(),
  }))
  expectTypeOf(fromGenericOptionsQueryFn.data).toEqualTypeOf<
    string | undefined
  >()
  expectTypeOf(fromGenericOptionsQueryFn.error).toEqualTypeOf<Error | null>()

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

  // it should handle query-functions that return Promise<any>
  useQuery(() => ({
    queryKey: key,
    queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
  }))

  // handles wrapped queries with custom fetcher passed as inline queryFn
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

  // handles wrapped queries with custom fetcher passed directly to useQuery
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

  describe('initialData', () => {
    describe('Config object overload', () => {
      it('TData should always be defined when initialData is provided as an object', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should be defined when passed through queryOptions', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        })
        const { data } = useQuery(() => options)

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key overload', () => {
      it('TData should always be defined when initialData is provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key and func', () => {
      it('TData should always be defined when initialData is provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
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
