import type { Signal } from '@angular/core'

import type {
  DefaultError,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  WithRequired,
} from '@tanstack/query-core'
import type { MapToSignals } from './signal-proxy'

export interface CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends WithRequired<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    'queryKey'
  > {}

export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
  State = QueryObserverResult<TData, TError>,
> = MapToSignals<State>

export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Omit<
    WithRequired<
      CreateBaseQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey
      >,
      'queryKey'
    >,
    'suspense'
  > {}

export type CreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = CreateBaseQueryResult<TData, TError>

/** Options for createInfiniteQuery */
export type CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>

export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Signal<InfiniteQueryObserverResult<TData, TError>>

export type DefinedCreateQueryResult<
  TData = unknown,
  TError = DefaultError,
  DefinedQueryObserver = DefinedQueryObserverResult<TData, TError>,
> = MapToSignals<DefinedQueryObserver>

export type CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = Omit<
  MutationObserverOptions<TData, TError, TVariables, TContext>,
  '_defaulted' | 'variables'
>

export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type CreateBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
> & {
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>
}

/** Result from createMutation */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = MapToSignals<CreateBaseMutationResult<TData, TError, TVariables, TContext>>

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
