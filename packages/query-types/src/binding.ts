import type { DefaultError, QueryKey } from './types'

/**
 * Type arguments and classes used by options and callbacks. Each runtime supplies
 * its public classes using polymorphic `this` to read the current type arguments.
 * For example, `QueryOf` selects `Query` after binding the data, error, and key.
 */
interface RuntimeBinding {
  data: unknown
  queryFnData: unknown
  queryData: unknown
  error: unknown
  // A tuple keeps a bound key exact when this slot intersects with its input.
  queryKey: ReadonlyArray<QueryKey>
  variables: unknown
  onMutateResult: unknown
  /** The client passed to query functions and mutations. */
  QueryClient: unknown
  /** The query cache accepted in client options. */
  QueryCache: unknown
  /** The mutation cache accepted in client options. */
  MutationCache: unknown
  /** The query passed to predicates, option callbacks, and cache listeners. */
  Query: unknown
  /** The mutation passed to predicates and cache listeners. */
  Mutation: unknown
  /** The observer included in query cache notifications. */
  QueryObserver: unknown
  /** The observer included in mutation cache notifications. */
  MutationObserver: unknown
}

type QueryClientOf<TRuntime extends RuntimeBinding> = TRuntime['QueryClient']

type QueryCacheOf<TRuntime extends RuntimeBinding> = TRuntime['QueryCache']

type MutationCacheOf<TRuntime extends RuntimeBinding> =
  TRuntime['MutationCache']

type BoundQuery<TRuntime, TQueryFnData, TError, TData, TQueryKey> = TRuntime & {
  queryFnData: TQueryFnData
  error: TError
  data: TData
  queryKey: [TQueryKey]
}

type QueryOf<
  TRuntime extends RuntimeBinding,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = BoundQuery<TRuntime, TQueryFnData, TError, TData, TQueryKey>['Query']

/** Allows an adapter to supply its own polling option while preserving the query type in callbacks. */
type RefetchIntervalOf<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = TRuntime extends { refetchInterval: unknown }
  ? BoundQuery<
      TRuntime,
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >['refetchInterval']
  : | number
    | false
    | ((
        query: QueryOf<TRuntime, TQueryFnData, TError, TData, TQueryKey>,
      ) => number | false | undefined)

type MutationOf<
  TRuntime extends RuntimeBinding,
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = (TRuntime & {
  data: TData
  error: TError
  variables: TVariables
  onMutateResult: TOnMutateResult
})['Mutation']

type QueryObserverOf<
  TRuntime extends RuntimeBinding,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = (TRuntime & {
  queryFnData: TQueryFnData
  error: TError
  data: TData
  queryData: TQueryData
  queryKey: [TQueryKey]
})['QueryObserver']

type MutationObserverOf<
  TRuntime extends RuntimeBinding,
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (TRuntime & {
  data: TData
  error: TError
  variables: TVariables
  onMutateResult: TOnMutateResult
})['MutationObserver']

export type {
  RuntimeBinding,
  QueryClientOf,
  QueryCacheOf,
  MutationCacheOf,
  QueryOf,
  RefetchIntervalOf,
  MutationOf,
  QueryObserverOf,
  MutationObserverOf,
}
