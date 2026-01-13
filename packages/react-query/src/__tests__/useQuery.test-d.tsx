import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { useQuery } from '../useQuery'
import { queryOptions } from '../queryOptions'
import type {
  InferErrorFromFn,
  OmitKeyof,
  QueryFunction,
  Throws,
  UseQueryOptions,
} from '..'

describe('useQuery', () => {
  const key = queryKey()

  // unspecified query function should default to unknown
  const noQueryFn = useQuery({ queryKey: key })
  expectTypeOf(noQueryFn.data).toEqualTypeOf<unknown>()
  expectTypeOf(noQueryFn.error).toEqualTypeOf<Error | null>()

  // it should infer the result type from the query function
  const fromQueryFn = useQuery({ queryKey: key, queryFn: () => 'test' })
  expectTypeOf(fromQueryFn.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(fromQueryFn.error).toEqualTypeOf<Error | null>()
  expectTypeOf(fromQueryFn.promise).toEqualTypeOf<Promise<string>>()

  // it should be possible to specify the result type
  const withResult = useQuery<string>({
    queryKey: key,
    queryFn: () => 'test',
  })
  expectTypeOf(withResult.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(withResult.error).toEqualTypeOf<Error | null>()

  // it should be possible to specify the error type
  const withError = useQuery<string, Error>({
    queryKey: key,
    queryFn: () => 'test',
  })
  expectTypeOf(withError.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(withError.error).toEqualTypeOf<Error | null>()

  // it should provide the result type in the configuration
  useQuery({
    queryKey: [key],
    queryFn: () => Promise.resolve(true),
  })

  // it should be possible to specify a union type as result type
  const unionTypeSync = useQuery({
    queryKey: key,
    queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
  })
  expectTypeOf(unionTypeSync.data).toEqualTypeOf<'a' | 'b' | undefined>()
  const unionTypeAsync = useQuery<'a' | 'b'>({
    queryKey: key,
    queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
  })
  expectTypeOf(unionTypeAsync.data).toEqualTypeOf<'a' | 'b' | undefined>()

  // should error when the query function result does not match with the specified type
  // @ts-expect-error
  useQuery<number>({ queryKey: key, queryFn: () => 'test' })

  // it should infer the result type from a generic query function
  function queryFn<T = string>(): Promise<T> {
    return Promise.resolve({} as T)
  }

  const fromGenericQueryFn = useQuery({
    queryKey: key,
    queryFn: () => queryFn(),
  })
  expectTypeOf(fromGenericQueryFn.data).toEqualTypeOf<string | undefined>()
  expectTypeOf(fromGenericQueryFn.error).toEqualTypeOf<Error | null>()

  const fromGenericOptionsQueryFn = useQuery({
    queryKey: key,
    queryFn: () => queryFn(),
  })
  expectTypeOf(fromGenericOptionsQueryFn.data).toEqualTypeOf<
    string | undefined
  >()
  expectTypeOf(fromGenericOptionsQueryFn.error).toEqualTypeOf<Error | null>()

  type MyData = number
  type MyQueryKey = readonly ['my-data', number]

  const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = ({
    queryKey: [, n],
  }) => {
    return Promise.resolve(n + 42)
  }

  useQuery({
    queryKey: ['my-data', 100],
    queryFn: getMyDataArrayKey,
  })

  const getMyDataStringKey: QueryFunction<MyData, ['1']> = (context) => {
    expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
    return Promise.resolve(Number(context.queryKey[0]) + 42)
  }

  useQuery({
    queryKey: ['1'],
    queryFn: getMyDataStringKey,
  })

  // it should handle query-functions that return Promise<any>
  const anyQuery = useQuery({
    queryKey: key,
    queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
  })
  expectTypeOf(anyQuery.error).toEqualTypeOf<Error | null>()

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
      'queryKey' | 'queryFn' | 'initialData'
    >,
  ) =>
    useQuery({
      queryKey: qk,
      queryFn: () => fetcher(qk[1], 'token'),
      ...options,
    })
  const testQuery = useWrappedQuery([''], () => Promise.resolve('1'))
  expectTypeOf(testQuery.data).toEqualTypeOf<string | undefined>()

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
      'queryKey' | 'queryFn' | 'initialData'
    >,
  ) => useQuery({ queryKey: qk, queryFn: fetcher, ...options })
  const testFuncStyle = useWrappedFuncStyleQuery([''], () =>
    Promise.resolve(true),
  )
  expectTypeOf(testFuncStyle.data).toEqualTypeOf<boolean | undefined>()

  it('should return the correct states for a successful query', () => {
    const state = useQuery<string, Error>({
      queryKey: key,
      queryFn: () => Promise.resolve('test'),
    })

    if (state.isPending) {
      expectTypeOf(state.data).toEqualTypeOf<undefined>()
      expectTypeOf(state.error).toEqualTypeOf<null>()
      return <span>pending</span>
    }

    if (state.isLoadingError) {
      expectTypeOf(state.data).toEqualTypeOf<undefined>()
      expectTypeOf(state.error).toEqualTypeOf<Error>()
      return <span>{state.error.message}</span>
    }

    expectTypeOf(state.data).toEqualTypeOf<string>()
    expectTypeOf(state.error).toEqualTypeOf<Error | null>()
    return <span>{state.data}</span>
  })

  describe('initialData', () => {
    describe('Config object overload', () => {
      it('TData should always be defined when initialData is provided as an object', () => {
        const { data } = useQuery({
          queryKey: ['key'],
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        })

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should be defined when passed through queryOptions', () => {
        const options = queryOptions({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: {
            wow: true,
          },
        })
        const { data } = useQuery(options)

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
        const options = queryOptions({
          queryKey: ['key'],
          queryFn: () => Promise.resolve(1),
        })

        const query = useQuery({
          ...options,
          select: (data) => data > 1,
        })

        expectTypeOf(query.data).toEqualTypeOf<boolean | undefined>()
      })

      it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
        const { data } = useQuery({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => ({
            wow: true,
          }),
        })

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
        })

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
        const { data } = useQuery({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        })

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
        const { data, isSuccess } = useQuery({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        })

        if (isSuccess) {
          expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
        }
      })

      // eslint-disable-next-line vitest/expect-expect
      it('TData should depend from only arguments, not the result', () => {
        // @ts-expect-error
        const result: UseQueryResult<{ wow: string }> = useQuery({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        })

        void result
      })

      it('data should not have undefined when initialData is provided', () => {
        const { data } = useQuery({
          queryKey: ['query-key'],
          initialData: 42,
        })

        expectTypeOf(data).toEqualTypeOf<number>()
      })
    })

    describe('custom hook', () => {
      it('should allow custom hooks using UseQueryOptions', () => {
        type Data = string

        const useCustomQuery = (
          options?: OmitKeyof<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
        ) => {
          return useQuery({
            ...options,
            queryKey: ['todos-key'],
            queryFn: () => Promise.resolve('data'),
          })
        }

        const { data } = useCustomQuery()

        expectTypeOf(data).toEqualTypeOf<Data | undefined>()
      })
    })

    describe('structuralSharing', () => {
      it('should be able to use structuralSharing with unknown types', () => {
        // https://github.com/TanStack/query/issues/6525#issuecomment-1938411343
        useQuery({
          queryKey: ['key'],
          queryFn: () => 5,
          structuralSharing: (oldData, newData) => {
            expectTypeOf(oldData).toBeUnknown()
            expectTypeOf(newData).toBeUnknown()
            return newData
          },
        })
      })
    })
  })

  describe('Throws pattern for typed errors', () => {
    // Custom error type
    class ApiError extends Error {
      constructor(
        public code: number,
        message: string,
      ) {
        super(message)
      }
    }

    // Data type
    type User = { id: string; name: string }

    // Function that declares what error it can throw using Throws<E>
    const fetchUser = async (_id: string): Promise<User & Throws<ApiError>> => {
      throw new ApiError(404, 'User not found')
    }

    it('should allow explicit error type using generics', () => {
      // Option 1: Explicit generics - most straightforward way to type errors
      const { data, error } = useQuery<User, ApiError>({
        queryKey: ['user', '1'],
        queryFn: () => fetchUser('1'),
      })

      expectTypeOf(data).toEqualTypeOf<User | undefined>()
      expectTypeOf(error).toEqualTypeOf<ApiError | null>()
    })

    it('should infer error type from Throws return type', () => {
      const { data, error } = useQuery({
        queryKey: ['user', 'auto'],
        queryFn: () => fetchUser('auto'),
      })

      expectTypeOf(data).toEqualTypeOf<User | undefined>()
      expectTypeOf(error).toEqualTypeOf<ApiError | null>()
    })

    it('should allow using InferErrorFromFn helper to extract error type', () => {
      // Option 2: Use InferErrorFromFn to extract the error type from the function
      type FetchUserError = InferErrorFromFn<typeof fetchUser>
      expectTypeOf<FetchUserError>().toEqualTypeOf<ApiError>()

      const { data, error } = useQuery<
        User,
        InferErrorFromFn<typeof fetchUser>
      >({
        queryKey: ['user', '2'],
        queryFn: () => fetchUser('2'),
      })

      expectTypeOf(data).toEqualTypeOf<User | undefined>()
      expectTypeOf(error).toEqualTypeOf<ApiError | null>()
    })

    it('should infer DefaultError when function does not use Throws', () => {
      // Function without Throws annotation
      const fetchData = async (): Promise<string> => 'data'

      type FetchDataError = InferErrorFromFn<typeof fetchData>
      expectTypeOf<FetchDataError>().toEqualTypeOf<Error>()
    })

    it('should work with union error types', () => {
      class NetworkError extends Error {
        type = 'network' as const
      }
      class ValidationError extends Error {
        type = 'validation' as const
      }

      type Data = { value: number }

      const fetchWithMultipleErrors = async (): Promise<
        Data & Throws<NetworkError | ValidationError>
      > => {
        throw new NetworkError('Network failed')
      }

      type InferredError = InferErrorFromFn<typeof fetchWithMultipleErrors>
      expectTypeOf<InferredError>().toEqualTypeOf<
        NetworkError | ValidationError
      >()

      const { error } = useQuery<Data, InferredError>({
        queryKey: ['data'],
        queryFn: fetchWithMultipleErrors,
      })

      expectTypeOf(error).toEqualTypeOf<NetworkError | ValidationError | null>()
    })
  })
})
