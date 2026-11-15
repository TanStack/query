/* istanbul ignore file */

import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverResult,
  MutationObserverOptions,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type {
  InfiniteQueryObserverOptions,
  QueryObserverOptions,
} from './QueryClient'
import type { Accessor } from 'solid-js'

/**
 * The options accepted by `useQuery`. Extends {@link QueryObserverOptions} from `@tanstack/query-core` with
 * the `solid-query`-specific `deferStream` and `reconcile` options.
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
> extends OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  'suspense'
> {
  /**
   * Defer the SSR stream flush until this query resolves on the server,
   * instead of letting the surrounding `<Loading>` boundary render its
   * fallback into the HTML. Passed through to Solid's own per-computation
   * `deferStream` option; server-only, ignored on the client.
   */
  deferStream?: boolean
  /**
   * Reconciliation key for the data store. `data` is served as a Solid
   * store projection: every landing (refetch, invalidation, placeholder
   * upgrade) reconciles into the existing proxy graph instead of replacing
   * it, so deep reads are fine-grained and item identity survives across
   * fetches. This sets the identity key for that reconciliation — a
   * property name, a key-extraction function, or `null` to merge
   * positionally. Defaults to `'id'`. Read once at creation.
   */
  reconcile?: string | ((item: NonNullable<any>) => any) | null
}

/**
 * The options accepted by `useQuery` and `queryOptions`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends UseBaseQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey
> {}

/**
 * The accessor `useQuery` expects as its first argument — Solid re-evaluates it reactively, so `queryKey` and
 * other options can depend on signals.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<QueryOptions<TQueryFnData, TError, TData, TQueryKey>>

/* --- Create Query and Create Base Query  Types --- */

/**
 * `data` is non-optional: it is a suspending async read. It never returns
 * `undefined` — a read either suspends into the nearest `<Loading>`
 * boundary (first fetch in flight, disabled, restoring), returns a value
 * (committed, placeholder, initial), or throws (`<Errored>` /
 * `throwOnError`). The v5 `TData | undefined` face existed because reads
 * could observe the pre-fetch gap; here that gap is suspension.
 */
export type UseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Override<
  OmitKeyof<QueryObserverResult<TData, TError>, 'isInitialLoading'>,
  { data: TData }
>

/**
 * The object `useQuery` returns. Same as {@link UseBaseQueryResult}.
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type UseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = UseBaseQueryResult<TData, TError>

/**
 * Distributes an `isInitialLoading` omit over result unions so status
 * discriminants survive (a plain Omit over a union collapses it).
 */
type OmitIsInitialLoading<T> = T extends unknown
  ? OmitKeyof<T, 'isInitialLoading' & keyof T>
  : never

export type DefinedUseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = OmitIsInitialLoading<DefinedQueryObserverResult<TData, TError>>

/**
 * The object `useQuery` returns when `initialData` guarantees `data` is never `undefined` (unless a
 * `select` changes `TData` to include `undefined`).
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type DefinedUseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedUseBaseQueryResult<TData, TError>

/* --- Create Infinite Queries Types --- */
/**
 * The options accepted by `useInfiniteQuery`.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export interface InfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'queryKey' | 'suspense'
> {
  /**
   * The query key to use for this query. Required here, unlike on the options this type extends.
   *
   * The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/solid/guides/query-keys)
   * for more information.
   *
   * The query will automatically update when this key changes (as long as `enabled` is not set to `false`).
   */
  queryKey: TQueryKey
  /**
   * Defer the SSR stream flush until this query resolves on the server —
   * see {@link UseBaseQueryOptions.deferStream}.
   */
  deferStream?: boolean
  /**
   * Reconciliation key for the data store — see
   * {@link UseBaseQueryOptions.reconcile}. For infinite queries this keys
   * items within pages; pages themselves merge positionally.
   */
  reconcile?: string | ((item: NonNullable<any>) => any) | null
}

/**
 * The accessor `useInfiniteQuery` expects as its first argument — Solid re-evaluates it reactively, so
 * `queryKey` and other options can depend on signals.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
>

/** Non-optional `data` for the same reason as {@link UseBaseQueryResult}. */
export type UseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Override<
  OmitKeyof<InfiniteQueryObserverResult<TData, TError>, 'isInitialLoading'>,
  { data: TData }
>

/**
 * The object `useInfiniteQuery` returns when `initialData` guarantees `data` is never `undefined` (unless a
 * `select` changes `TData` to include `undefined`).
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = OmitIsInitialLoading<DefinedInfiniteQueryObserverResult<TData, TError>>

/* --- Create Mutation Types --- */
/**
 * The options accepted by `useMutation` and `mutationOptions`.
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variables your `mutationFn` accepts.
 * @template TOnMutateResult - The type returned by `onMutate`, passed on to `onSuccess`/`onError`/`onSettled`.
 */
export interface MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
> {}

/**
 * The accessor `useMutation` expects as its first argument — Solid re-evaluates it reactively, so callbacks
 * and other options can depend on signals.
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variables your `mutationFn` accepts.
 * @template TOnMutateResult - The type returned by `onMutate`, passed on to `onSuccess`/`onError`/`onSettled`.
 */
export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Accessor<MutationOptions<TData, TError, TVariables, TOnMutateResult>>

/**
 * One `mutate`, returning a safe-to-ignore promise: errors are also routed
 * into reactive state, and ignoring the promise never surfaces an
 * unhandled rejection. Call-site callbacks are gone — settle logic that
 * used to live in `mutate(vars, { onSuccess })` is linear code after
 * `await mutate(vars)` or a config-level callback.
 */
export type UseMutateFunction<
  TData = unknown,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _TError = DefaultError,
  TVariables = void,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _TOnMutateResult = unknown,
> = (
  ...args: undefined extends TVariables
    ? [variables?: TVariables]
    : [variables: TVariables]
) => Promise<TData>

/**
 * The result of `useMutation`. Same as {@link MutationObserverResult} from `@tanstack/query-core`, with
 * `mutate` replaced by the promise-returning {@link UseMutateFunction}.
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variable passed to `mutate`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  OmitKeyof<
    MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
    'context'
  >,
  { mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult> }
>

/**
 * The result of `useMutation`. Same as {@link UseBaseMutationResult}.
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variable passed to `mutate`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>
