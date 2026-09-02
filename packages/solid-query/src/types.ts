/* istanbul ignore file */

import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverResult,
  MutateFunction,
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
 * The options accepted by `useQuery` and `useInfiniteQuery`'s shared base.
 *
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
   * Only applicable while rendering queries on the server with streaming.
   * Set `deferStream` to `true` to wait for the query to resolve on the server before flushing the stream.
   * This can be useful to avoid sending a loading state to the client before the query has resolved.
   * Defaults to `false`.
   */
  deferStream?: boolean
  /**
   * @deprecated The `suspense` option has been deprecated in v5 and will be removed in the next major version.
   * The `data` property on useQuery is a SolidJS resource and will automatically suspend when the data is loading.
   * Setting `suspense` to `false` will be a no-op.
   */
  suspense?: boolean
}

/**
 * The options accepted by `useQuery` and `queryOptions`.
 *
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
 *
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
 * The object `useQuery`'s shared base returns — `data`/`error` may still be `undefined`/`null` while the
 * query is `pending`.
 *
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type UseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

/**
 * The object `useQuery` returns — `data`/`error` may still be `undefined`/`null` while the query is
 * `pending`.
 *
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type UseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = UseBaseQueryResult<TData, TError>

/**
 * The object `useQuery`'s shared base returns when `initialData` guarantees `data` is never `undefined`.
 *
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type DefinedUseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

/**
 * The object `useQuery` returns when `initialData` guarantees `data` is never `undefined`.
 *
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
 *
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
  queryKey: TQueryKey
  /**
   * Only applicable while rendering queries on the server with streaming.
   * Set `deferStream` to `true` to wait for the query to resolve on the server before flushing the stream.
   * This can be useful to avoid sending a loading state to the client before the query has resolved.
   * Defaults to `false`.
   */
  deferStream?: boolean
  /**
   * @deprecated The `suspense` option has been deprecated in v5 and will be removed in the next major version.
   * The `data` property on useInfiniteQuery is a SolidJS resource and will automatically suspend when the data is loading.
   * Setting `suspense` to `false` will be a no-op.
   */
  suspense?: boolean
}

/**
 * The accessor `useInfiniteQuery` expects as its first argument — Solid re-evaluates it reactively, so
 * `queryKey` and other options can depend on signals.
 *
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

/**
 * The object `useInfiniteQuery` returns — `data`/`error` may still be `undefined`/`null` while the query is
 * `pending`.
 *
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type UseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = InfiniteQueryObserverResult<TData, TError>

/**
 * The object `useInfiniteQuery` returns when `initialData` guarantees `data` is never `undefined`.
 *
 * @template TData - The type `data` ends up as, after `select` runs (if set).
 * @template TError - The type of errors this query may hold.
 */
export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

/* --- Create Mutation Types --- */
/**
 * The options accepted by `useMutation` and `mutationOptions`.
 *
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variables your `mutationFn` accepts.
 * @template TOnMutateResult - The type returned by `onMutate`, passed on to `onError`/`onSettled`.
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
 *
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variables your `mutationFn` accepts.
 * @template TOnMutateResult - The type returned by `onMutate`, passed on to `onError`/`onSettled`.
 */
export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Accessor<MutationOptions<TData, TError, TVariables, TOnMutateResult>>

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
 *
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
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
 *
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
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
 *
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
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
