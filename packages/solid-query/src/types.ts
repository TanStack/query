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
}

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
> = Override<QueryObserverResult<TData, TError>, { data: TData }>

export type UseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = UseBaseQueryResult<TData, TError>

export type DefinedUseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

export type DefinedUseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedUseBaseQueryResult<TData, TError>

/* --- Create Infinite Queries Types --- */
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
   * Defer the SSR stream flush until this query resolves on the server —
   * see {@link UseBaseQueryOptions.deferStream}.
   */
  deferStream?: boolean
}

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
> = Override<InfiniteQueryObserverResult<TData, TError>, { data: TData }>

export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

/* --- Create Mutation Types --- */
export interface MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
> {}

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
> = (variables: TVariables) => Promise<TData>

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

export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>
