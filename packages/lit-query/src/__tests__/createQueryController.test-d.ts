import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { createQueryController } from '../createQueryController.js'
import { queryOptions } from '../queryOptions.js'
import type { OmitKeyof, QueryFunction } from '@tanstack/query-core'
import type { CreateQueryOptions } from '../createQueryController.js'

class Host extends LitElement {}

describe('createQueryController', () => {
  it('should default data to unknown when the query function is not specified', () => {
    const query = createQueryController(
      new Host(),
      { queryKey: queryKey() },
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<unknown>()
    expectTypeOf(query().error).toEqualTypeOf<Error | null>()
  })

  it('should infer the result type from the query function', () => {
    const query = createQueryController(
      new Host(),
      { queryKey: queryKey(), queryFn: () => 'test' },
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(query().error).toEqualTypeOf<Error | null>()
  })

  it('should be possible to specify the result type', () => {
    const query = createQueryController<string>(
      new Host(),
      { queryKey: queryKey(), queryFn: () => 'test' },
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(query().error).toEqualTypeOf<Error | null>()
  })

  it('should be possible to specify the error type', () => {
    const query = createQueryController<string, Error>(
      new Host(),
      { queryKey: queryKey(), queryFn: () => 'test' },
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(query().error).toEqualTypeOf<Error | null>()
  })

  it('should be possible to specify a union type as result type', () => {
    const unionTypeSync = createQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
      },
      new QueryClient(),
    )
    expectTypeOf(unionTypeSync().data).toEqualTypeOf<'a' | 'b' | undefined>()

    const unionTypeAsync = createQueryController<'a' | 'b'>(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
      },
      new QueryClient(),
    )
    expectTypeOf(unionTypeAsync().data).toEqualTypeOf<'a' | 'b' | undefined>()
  })

  it('should error when the query function result does not match with the specified type', () => {
    assertType(
      createQueryController<number>(
        new Host(),
        // @ts-expect-error
        { queryKey: queryKey(), queryFn: () => 'test' },
        new QueryClient(),
      ),
    )
  })

  it('should infer the result type from a generic query function', () => {
    function queryFn<T = string>(): Promise<T> {
      return Promise.resolve({} as T)
    }

    const query = createQueryController(
      new Host(),
      { queryKey: queryKey(), queryFn: () => queryFn() },
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(query().error).toEqualTypeOf<Error | null>()
  })

  it('should infer the query key from a typed query function', () => {
    const getMyDataStringKey: QueryFunction<number, ['1']> = (context) => {
      expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
      return Promise.resolve(Number(context.queryKey[0]) + 42)
    }

    const query = createQueryController(
      new Host(),
      { queryKey: ['1'], queryFn: getMyDataStringKey },
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<number | undefined>()
  })

  it('should handle wrapped queries with a custom fetcher passed as an inline query function', () => {
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
        CreateQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryFnData,
          TQueryKey
        >,
        'queryKey' | 'queryFn' | 'initialData'
      >,
    ) =>
      createQueryController(
        new Host(),
        {
          queryKey: qk,
          queryFn: () => fetcher(qk[1], 'token'),
          ...options,
        },
        new QueryClient(),
      )

    const query = createWrappedQuery([''], () => Promise.resolve('1'))

    expectTypeOf(query().data).toEqualTypeOf<string | undefined>()
  })

  it('should handle wrapped queries with a custom fetcher passed directly to createQueryController', () => {
    const createWrappedFuncStyleQuery = <
      TQueryKey extends [string, Record<string, unknown>?],
      TQueryFnData,
      TError,
      TData = TQueryFnData,
    >(
      qk: TQueryKey,
      fetcher: () => Promise<TQueryFnData>,
      options?: OmitKeyof<
        CreateQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryFnData,
          TQueryKey
        >,
        'queryKey' | 'queryFn' | 'initialData'
      >,
    ) =>
      createQueryController(
        new Host(),
        { queryKey: qk, queryFn: fetcher, ...options },
        new QueryClient(),
      )

    const query = createWrappedFuncStyleQuery([''], () => Promise.resolve(true))

    expectTypeOf(query().data).toEqualTypeOf<boolean | undefined>()
  })

  it('should return the correct states for a successful query', () => {
    const query = createQueryController<string, Error>(
      new Host(),
      { queryKey: queryKey(), queryFn: () => Promise.resolve('test') },
      new QueryClient(),
    )
    const state = query()

    if (state.isPending) {
      expectTypeOf(state.data).toEqualTypeOf<undefined>()
      expectTypeOf(state.error).toEqualTypeOf<null>()
      return
    }

    if (state.isLoadingError) {
      expectTypeOf(state.data).toEqualTypeOf<undefined>()
      expectTypeOf(state.error).toEqualTypeOf<Error>()
      return
    }

    expectTypeOf(state.data).toEqualTypeOf<string>()
    expectTypeOf(state.error).toEqualTypeOf<Error | null>()
  })

  describe('initialData', () => {
    it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into createQueryController', () => {
      const options = queryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(1),
      })
      const query = createQueryController(
        new Host(),
        { ...options, select: (data) => data > 1 },
        new QueryClient(),
      )

      expectTypeOf(query().data).toEqualTypeOf<boolean | undefined>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const query = createQueryController(
        new Host(),
        { queryKey: queryKey(), queryFn: () => ({ wow: true }) },
        new QueryClient(),
      )

      expectTypeOf(query().data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const query = createQueryController(
        new Host(),
        {
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        },
        new QueryClient(),
      )

      expectTypeOf(query().data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      const query = createQueryController(
        new Host(),
        {
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        },
        new QueryClient(),
      )
      const { data, isSuccess } = query()

      if (isSuccess) {
        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      }
    })

    it('should preserve discriminated-union narrowing', () => {
      type Result =
        { type: 'first'; first: string } | { type: 'second'; second: string }

      const query = createQueryController(
        new Host(),
        {
          queryKey: queryKey(),
          queryFn: (): Result => ({ type: 'first', first: 'a' }),
        },
        new QueryClient(),
      )
      const data = query().data

      const second = data?.type === 'first' ? undefined : data

      expectTypeOf(second).toEqualTypeOf<
        { type: 'second'; second: string } | undefined
      >()
    })
  })

  describe('custom controller', () => {
    it('should allow custom controllers using CreateQueryOptions', () => {
      type Data = string

      const createCustomQuery = (
        options?: OmitKeyof<CreateQueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) =>
        createQueryController(
          new Host(),
          {
            ...options,
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('data'),
          },
          new QueryClient(),
        )

      const query = createCustomQuery()

      expectTypeOf(query().data).toEqualTypeOf<Data | undefined>()
    })
  })

  describe('structuralSharing', () => {
    it('should be able to use structuralSharing with unknown types', () => {
      createQueryController(
        new Host(),
        {
          queryKey: queryKey(),
          queryFn: () => 5,
          structuralSharing: (oldData, newData) => {
            expectTypeOf(oldData).toBeUnknown()
            expectTypeOf(newData).toBeUnknown()
            return newData
          },
        },
        new QueryClient(),
      )
    })
  })

  describe('generic indexed access TData', () => {
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

      const readLabel = <TDataType extends DataType>(dataType: TDataType) => {
        const query = createQueryController(
          new Host(),
          { queryKey: ['test'], queryFn: () => getData(dataType) },
          new QueryClient(),
        )
        const data = query().data

        return data ? getLabel(dataType, data) : null
      }

      expectTypeOf(readLabel).toBeFunction()
    })
  })
})
