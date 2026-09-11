import { describe, expectTypeOf, it } from 'vitest'
import type { FetchDirection } from '../query'
import type {
  DataTag,
  DefaultError,
  DistributiveOmit,
  FetchStatus,
  InferDataFromTag,
  InferErrorFromTag,
  InfiniteData,
  MutateFunction,
  MutationStatus,
  NetworkMode,
  NonUndefinedGuard,
  Override,
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  QueryObserverLoadingErrorResult,
  QueryObserverPendingResult,
  QueryObserverRefetchErrorResult,
  QueryObserverResult,
  QueryObserverSuccessResult,
  QueryStatus,
  StaleTime,
  UnsetMarker,
  WithRequired,
  dataTagErrorSymbol,
  dataTagSymbol,
} from '..'

describe('DataTag', () => {
  it('brands a query key with data and error types', () => {
    type Tagged = DataTag<QueryKey, string, Error>
    expectTypeOf<Tagged[dataTagSymbol]>().toEqualTypeOf<string>()
    expectTypeOf<Tagged[dataTagErrorSymbol]>().toEqualTypeOf<Error>()
  })

  it('defaults the error brand to the unset marker', () => {
    type Tagged = DataTag<Array<string>, number>
    expectTypeOf<Tagged[dataTagSymbol]>().toEqualTypeOf<number>()
    expectTypeOf<Tagged[dataTagErrorSymbol]>().toEqualTypeOf<UnsetMarker>()
  })

  it('is idempotent on already-tagged keys', () => {
    type Tagged = DataTag<Array<string>, number, Error>
    expectTypeOf<DataTag<Tagged, boolean, TypeError>>().toEqualTypeOf<Tagged>()
  })

  it('feeds InferDataFromTag: the tag wins over the declared TQueryFnData', () => {
    type Tagged = DataTag<Array<string>, number>
    expectTypeOf<InferDataFromTag<string, Tagged>>().toEqualTypeOf<number>()
  })

  it('InferDataFromTag falls back to TQueryFnData on untagged keys', () => {
    expectTypeOf<
      InferDataFromTag<string, Array<number>>
    >().toEqualTypeOf<string>()
  })

  it('InferErrorFromTag extracts the tagged error type', () => {
    type Tagged = DataTag<Array<string>, unknown, TypeError>
    expectTypeOf<
      InferErrorFromTag<DefaultError, Tagged>
    >().toEqualTypeOf<TypeError>()
  })

  it('InferErrorFromTag falls back to TError while the error tag is unset', () => {
    type Tagged = DataTag<Array<string>, unknown>
    expectTypeOf<
      InferErrorFromTag<DefaultError, Tagged>
    >().toEqualTypeOf<DefaultError>()
  })
})

describe('QueryFunctionContext', () => {
  it('exposes the query key and client for plain queries', () => {
    type Context = QueryFunctionContext<Array<string>>
    expectTypeOf<Context['queryKey']>().toEqualTypeOf<Array<string>>()
    expectTypeOf<Context['client']>().toEqualTypeOf<QueryClient>()
  })

  it('keeps pageParam and direction loose for plain queries', () => {
    type Context = QueryFunctionContext<Array<string>>
    expectTypeOf<Context['pageParam']>().toEqualTypeOf<unknown>()
    expectTypeOf<Context['direction']>().toEqualTypeOf<unknown>()
  })

  it('requires a typed pageParam and a direction for infinite queries', () => {
    type Context = QueryFunctionContext<Array<string>, number>
    expectTypeOf<Context['pageParam']>().toEqualTypeOf<number>()
    expectTypeOf<Context['direction']>().toEqualTypeOf<FetchDirection>()
  })
})

describe('QueryObserverResult', () => {
  it('pending results carry neither data nor error', () => {
    type Result = QueryObserverPendingResult<string, TypeError>
    expectTypeOf<Result['data']>().toEqualTypeOf<undefined>()
    expectTypeOf<Result['error']>().toEqualTypeOf<null>()
    expectTypeOf<Result['status']>().toEqualTypeOf<'pending'>()
    expectTypeOf<Result['isPending']>().toEqualTypeOf<true>()
  })

  it('loading errors surface the typed error with no data', () => {
    type Result = QueryObserverLoadingErrorResult<string, TypeError>
    expectTypeOf<Result['data']>().toEqualTypeOf<undefined>()
    expectTypeOf<Result['error']>().toEqualTypeOf<TypeError>()
    expectTypeOf<Result['status']>().toEqualTypeOf<'error'>()
  })

  it('refetch errors keep the last data alongside the typed error', () => {
    type Result = QueryObserverRefetchErrorResult<string, TypeError>
    expectTypeOf<Result['data']>().toEqualTypeOf<string>()
    expectTypeOf<Result['error']>().toEqualTypeOf<TypeError>()
    expectTypeOf<Result['isRefetchError']>().toEqualTypeOf<true>()
  })

  it('success results expose non-optional typed data', () => {
    type Result = QueryObserverSuccessResult<string, TypeError>
    expectTypeOf<Result['data']>().toEqualTypeOf<string>()
    expectTypeOf<Result['error']>().toEqualTypeOf<null>()
    expectTypeOf<Result['status']>().toEqualTypeOf<'success'>()
    expectTypeOf<Result['isSuccess']>().toEqualTypeOf<true>()
  })

  it('narrows the union by status: success variants always hold TData', () => {
    type SuccessLike = Extract<
      QueryObserverResult<string, TypeError>,
      { status: 'success' }
    >
    expectTypeOf<SuccessLike['data']>().toEqualTypeOf<string>()
    expectTypeOf<SuccessLike['error']>().toEqualTypeOf<null>()
  })

  it('narrows the union by status: pending variants never hold data', () => {
    type PendingLike = Extract<
      QueryObserverResult<string, TypeError>,
      { status: 'pending' }
    >
    expectTypeOf<PendingLike['data']>().toEqualTypeOf<undefined>()
  })
})

describe('MutateFunction', () => {
  it('can be called without variables when TVariables is void', () => {
    type Mutate = MutateFunction<string, Error, void>
    expectTypeOf<
      Mutate extends () => Promise<string> ? true : false
    >().toEqualTypeOf<true>()
  })

  it('can be called without variables when TVariables may be undefined', () => {
    type Mutate = MutateFunction<string, Error, number | undefined>
    expectTypeOf<
      Mutate extends () => Promise<string> ? true : false
    >().toEqualTypeOf<true>()
  })

  it('requires variables when TVariables cannot be undefined', () => {
    type Mutate = MutateFunction<string, Error, number>
    expectTypeOf<
      Mutate extends () => Promise<string> ? true : false
    >().toEqualTypeOf<false>()
    expectTypeOf<Parameters<Mutate>[0]>().toEqualTypeOf<number>()
  })

  it('always resolves to a promise of TData', () => {
    type Mutate = MutateFunction<string, Error, number>
    expectTypeOf<ReturnType<Mutate>>().toEqualTypeOf<Promise<string>>()
  })
})

describe('type utilities', () => {
  it('NonUndefinedGuard strips undefined distributively', () => {
    expectTypeOf<NonUndefinedGuard<string | undefined | null>>().toEqualTypeOf<
      string | null
    >()
    expectTypeOf<NonUndefinedGuard<undefined>>().toEqualTypeOf<never>()
  })

  it('Override replaces intersecting keys and preserves the rest', () => {
    type Base = { a: string; b: number }
    type Patch = { b: boolean }
    expectTypeOf<Override<Base, Patch>>().toEqualTypeOf<{
      a: string
      b: boolean
    }>()
  })

  it('WithRequired makes the chosen keys required', () => {
    type Input = { a?: string; b?: number }
    type Output = WithRequired<Input, 'a'>
    expectTypeOf<Output['a']>().toEqualTypeOf<string>()
    expectTypeOf<
      Output extends { a: string } ? true : false
    >().toEqualTypeOf<true>()
    expectTypeOf<Output['b']>().toEqualTypeOf<number | undefined>()
  })

  it('DistributiveOmit distributes over union members', () => {
    type Shape =
      | { kind: 'circle'; radius: number }
      | { kind: 'square'; size: number }
    expectTypeOf<DistributiveOmit<Shape, 'kind'>>().toEqualTypeOf<
      { radius: number } | { size: number }
    >()
  })

  it('InfiniteData pairs pages with their page params', () => {
    expectTypeOf<InfiniteData<string, number>>().toEqualTypeOf<{
      pages: Array<string>
      pageParams: Array<number>
    }>()
  })

  it('DefaultError falls back to Error without registration', () => {
    expectTypeOf<DefaultError>().toEqualTypeOf<Error>()
  })
})

describe('status unions', () => {
  it('QueryStatus covers exactly pending, error and success', () => {
    expectTypeOf<QueryStatus>().toEqualTypeOf<'pending' | 'error' | 'success'>()
  })

  it('FetchStatus covers exactly fetching, paused and idle', () => {
    expectTypeOf<FetchStatus>().toEqualTypeOf<'fetching' | 'paused' | 'idle'>()
  })

  it('MutationStatus covers exactly idle, pending, success and error', () => {
    expectTypeOf<MutationStatus>().toEqualTypeOf<
      'idle' | 'pending' | 'success' | 'error'
    >()
  })

  it('NetworkMode covers exactly online, always and offlineFirst', () => {
    expectTypeOf<NetworkMode>().toEqualTypeOf<
      'online' | 'always' | 'offlineFirst'
    >()
  })

  it('StaleTime accepts a number or the static literal', () => {
    expectTypeOf<StaleTime>().toEqualTypeOf<number | 'static'>()
  })
})
