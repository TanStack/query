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

export interface SolidQueryOptions<
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
> = Accessor<SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey>>

/* --- Create Query and Create Base Query  Types --- */

export type UseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

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
export interface SolidInfiniteQueryOptions<
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

export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  SolidInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
>

export type UseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = InfiniteQueryObserverResult<TData, TError>

export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

/* --- Create Mutation Types --- */
export interface SolidMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends OmitKeyof<
    MutationObserverOptions<TData, TError, TVariables, TContext>,
    '_defaulted'
  > {}

export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = Accessor<SolidMutationOptions<TData, TError, TVariables, TContext>>

export type UseMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type UseMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type UseBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TContext> }
> & {
  mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext>
}

export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TContext>
