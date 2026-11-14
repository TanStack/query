import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  Mutation,
  MutationFilters,
  MutationObserverOptions,
  MutationObserverResult,
  MutationState,
  OmitKeyof,
  Override,
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'

/** A function returning a value, read again whenever the value may change. */
export type Accessor<T> = () => T

/**
 * Input every tag accepts to use a specific client instead of the one from
 * `getQueryClient`.
 */
export interface ClientInput {
  /**
   * The client to use instead of the one for this `$global`.
   */
  client?: Accessor<QueryClient>
}

/**
 * The options of an observed query.
 */
export type CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> & {
  /**
   * Set to `false` to stop observing the query: no fetch is triggered by it,
   * and no cache update reaches the tag. The tag still applies new options, so
   * a changed `queryKey` renders the result of the new query.
   */
  subscribed?: boolean
}

/** The observer result as a tag returns it. */
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

/**
 * The options of `<query>`: the observer options and `subscribed`.
 */
export type CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>

/**
 * What `<query>` returns: the observer result with `data`, `error`, `status`
 * and the query methods.
 */
export type CreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = CreateBaseQueryResult<TData, TError>

/**
 * The observer result when `initialData` is set, so `data` is defined.
 */
export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

/**
 * What `<query>` returns when `initialData` is set. `data` is never `undefined`.
 */
export type DefinedCreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedCreateBaseQueryResult<TData, TError>

/**
 * The options of `<infinite-query>`: the observer options of an infinite query
 * (`queryFn`, `initialPageParam`, `getNextPageParam`) and `subscribed`.
 */
export type CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  /**
   * Set to `false` to stop observing the query: no fetch is triggered by it,
   * and no cache update reaches the tag. The tag still applies new options, so
   * a changed `queryKey` renders the result of the new query.
   */
  subscribed?: boolean
}

/**
 * What `<infinite-query>` returns: the pages in `data` and `fetchNextPage`
 * and `fetchPreviousPage`.
 */
export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = InfiniteQueryObserverResult<TData, TError>

/**
 * The result of `<infinite-query>` when `initialData` is set, so `data` is defined.
 */
export type DefinedCreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

/**
 * The observer options of a mutation: `mutationFn`, `onSuccess` and the
 * other callbacks.
 */
export type CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
>

/**
 * The `mutate` function of a mutation result. It returns nothing and reports
 * errors through the result.
 */
export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...args: Parameters<
    MutateFunction<TData, TError, TVariables, TOnMutateResult>
  >
) => void

/**
 * The `mutateAsync` function of a mutation result. Its promise rejects when
 * the mutation fails.
 */
export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>

/**
 * The observer result of a mutation, with `mutate` and `mutateAsync`.
 */
export type CreateBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }
> & {
  mutateAsync: CreateMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

/**
 * What `<mutation>` returns: the mutation state with `mutate`, `mutateAsync`
 * and `reset`.
 */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult>

/**
 * The `Mutation` type for a mutation state type, or `Mutation` for any other type.
 */
export type MutationTypeFromResult<TResult> = [TResult] extends [
  MutationState<
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult
  >,
]
  ? Mutation<TData, TError, TVariables, TOnMutateResult>
  : Mutation

/**
 * The `filters` and `select` that `<mutation-state>` uses to read the
 * mutation cache.
 */
export type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
> = {
  /**
   * Selects which mutations to read.
   */
  filters?: MutationFilters
  /**
   * Maps each matching mutation to the value to return.
   */
  select?: (mutation: TMutation) => TResult
}
