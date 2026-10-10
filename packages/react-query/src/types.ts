/* istanbul ignore file */

import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  DistributiveOmit,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  InfiniteQueryMode,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryExecuteOptions,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  SkipToken,
} from '@tanstack/query-core'

/**
 * {@link UseBaseQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseBaseQueryOptions = UseBaseQueryOptions<
  any,
  any,
  any,
  any,
  any
>
/**
 * The options shared by `useQuery` and `useSuspenseQuery`. Extends {@link QueryObserverOptions} from
 * `@tanstack/query-core` with the `react-query`-specific `subscribed` option.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryData - The type of the data actually held in the query cache — the input to `select` and
 * `placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UseBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey
> {
  /**
   * Set this to `false` to unsubscribe this observer from updates to the query cache.
   * @defaultValue true
   */
  subscribed?: boolean
}

/**
 * The options accepted by `usePrefetchQuery` — everything you can pass to `queryClient.query`, except `queryFn`
 * is required unless a default query function has been defined.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryData - The type of the data actually held in the query cache — the input to `select` and
 * `placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UsePrefetchQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<
  QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  'queryFn'
> & {
  /**
   * `skipToken` is not allowed as a value here — a prefetch always needs a query function to actually run,
   * unless a default query function has been defined.
   */
  queryFn?: Exclude<
    QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >['queryFn'],
    SkipToken
  >
}

/**
 * The options accepted by `usePrefetchInfiniteQuery` — everything you can pass to `queryClient.infiniteQuery`,
 * except `queryFn` is required unless a default query function has been defined.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params — a prefetch never reads `data` back out, so this
 * parameter only matters if you reuse these options elsewhere with `select` applied.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UsePrefetchInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = DistributiveOmit<
  InfiniteQueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'queryFn'
> & {
  /**
   * `skipToken` is not allowed as a value here — a prefetch always needs a query function to actually run,
   * unless a default query function has been defined.
   */
  queryFn?: Exclude<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken
  >
}

/**
 * {@link UseQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseQueryOptions = UseQueryOptions<any, any, any, any>
/**
 * The options accepted by `useQuery`. Same as {@link UseBaseQueryOptions}, minus `suspense` (which
 * `react-query` derives from which hook you call rather than exposing as an option).
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'suspense'
> {}

/**
 * {@link UseSuspenseQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseSuspenseQueryOptions = UseSuspenseQueryOptions<
  any,
  any,
  any,
  any
>
/**
 * The options accepted by `useSuspenseQuery`. Same as {@link UseQueryOptions}, minus `enabled`, `throwOnError`,
 * and `placeholderData` — Suspense hooks cannot render a "disabled" or "placeholder" state, so those options
 * don't apply.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UseSuspenseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn' | 'enabled' | 'throwOnError' | 'placeholderData'
> {
  /**
   * `skipToken` is not allowed here — Suspense hooks cannot render a "disabled" state, so a query function
   * must always be provided, unless a default query function has been defined.
   */
  queryFn?: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

/**
 * {@link UseInfiniteQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseInfiniteQueryOptions = UseInfiniteQueryOptions<
  any,
  any,
  any,
  any,
  any,
  any
>
/**
 * The options accepted by `useInfiniteQuery`. Extends {@link InfiniteQueryObserverOptions} from
 * `@tanstack/query-core` with the `react-query`-specific `subscribed` option, minus `suspense` (which
 * `react-query` derives from which hook you call rather than exposing as an option).
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UseInfiniteQueryOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = DistributiveOmit<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  'suspense'
> & {
  subscribed?: boolean
}

/**
 * The options accepted by `useInfiniteQuery`. Extends {@link InfiniteQueryObserverOptions} from
 * `@tanstack/query-core` with the `react-query`-specific `subscribed` option, minus `suspense` (which
 * `react-query` derives from which hook you call rather than exposing as an option).
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
> = UseInfiniteQueryOptionsBase<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
>

/**
 * The options accepted by `useSuspenseInfiniteQuery`. Same as {@link UseInfiniteQueryOptions}, minus `enabled`,
 * `throwOnError`, and `placeholderData` — Suspense hooks cannot render a "disabled" or "placeholder" state, so
 * those options don't apply.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UseSuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
> = DistributiveOmit<
  UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  'queryFn' | 'enabled' | 'throwOnError' | 'placeholderData'
> & {
  /**
   * The query function for Suspense. Cannot be skipToken.
   */
  queryFn?: Exclude<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >['queryFn'],
    SkipToken
  >
}

/**
 * Suspense infinite query options with all type parameters set to any.
 */
export type AnyUseSuspenseInfiniteQueryOptions =
  UseSuspenseInfiniteQueryOptions<any, any, any, any, any>

/**
 * The result of `useQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
 * `pending`. Re-exports {@link QueryObserverResult} from `@tanstack/query-core`. `useInfiniteQuery` returns
 * {@link UseInfiniteQueryResult} instead.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

/**
 * The result of `useQuery`. Same as {@link UseBaseQueryResult}.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = UseBaseQueryResult<TData, TError>

/**
 * The result of `useSuspenseQuery`. Same as {@link DefinedUseQueryResult}, minus `isPlaceholderData` — always
 * `false` on that type, so this drops the dead field rather than an active state.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseSuspenseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DistributiveOmit<
  DefinedQueryObserverResult<TData, TError>,
  'isPlaceholderData'
>

/**
 * The result of `useQuery` when `initialData` is set, or of `useSuspenseQuery` before the `isPlaceholderData`
 * omission — `data` is never `undefined` (unless a `select` changes `TData` to include `undefined`).
 * Re-exports {@link DefinedQueryObserverResult} from `@tanstack/query-core`.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type DefinedUseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

/**
 * The result of `useInfiniteQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
 * `pending`. Re-exports {@link InfiniteQueryObserverResult} from `@tanstack/query-core`.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>

/**
 * The result of `useInfiniteQuery` when `initialData` is set — `data` is never `undefined` (unless a
 * `select` changes `TData` to include `undefined`). Re-exports {@link DefinedInfiniteQueryObserverResult}
 * from `@tanstack/query-core`.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = DefinedInfiniteQueryObserverResult<TData, TError, TPageParam, TMode>

/**
 * The result of `useSuspenseInfiniteQuery`. Same as {@link DefinedUseInfiniteQueryResult}, minus
 * `isPlaceholderData` — Suspense hooks never render placeholder data.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseSuspenseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = OmitKeyof<
  DefinedInfiniteQueryObserverResult<TData, TError, TPageParam, TMode>,
  'isPlaceholderData'
>

/**
 * {@link UseMutationOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any mutation in a helper function.
 */
export type AnyUseMutationOptions = UseMutationOptions<any, any, any, any>
/**
 * The options accepted by `useMutation`. Same as {@link MutationObserverOptions} from `@tanstack/query-core`,
 * minus the internal `_defaulted` flag.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export interface UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
> {}

/**
 * The type of `mutate`, as returned by `useMutation`. Forwards the variables (and an optional per-call
 * `onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
 * through the mutation result instead of being thrown by `mutate`, unless `throwOnError` makes `useMutation`
 * rethrow them.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutateFunction<
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
 * The type of `mutateAsync`, as returned by `useMutation`. Similar to {@link UseMutateFunction}, but returns a
 * promise which can be awaited.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>

/**
 * The result of `useMutation`. Same as {@link MutationObserverResult} from `@tanstack/query-core`, with
 * `mutate` narrowed to the fire-and-forget {@link UseMutateFunction} signature, plus the added `mutateAsync`.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult> }
> & {
  /**
   * Similar to `mutate`, but returns a promise which can be awaited.
   */
  mutateAsync: UseMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

/**
 * The result of `useMutation`. Same as {@link UseBaseMutationResult}.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>
