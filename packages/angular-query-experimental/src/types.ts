import type { Signal } from '@angular/core'
import type { Observable } from 'rxjs'

import type {
  DefaultError,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  QueryFunctionContext,
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
  TPageParam = never,
> extends WithRequired<
    QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >,
    'queryKey'
  > {
  query$?: (
    context: QueryFunctionContext<TQueryKey, TPageParam>,
  ) => Observable<TQueryFnData>
}

type CreateStatusBasedQueryResult<
  TStatus extends QueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<QueryObserverResult<TData, TError>, { status: TStatus }>

export interface BaseQueryNarrowing<TData = unknown, TError = DefaultError> {
  isSuccess(
    this: CreateBaseQueryResult<TData, TError>,
  ): this is CreateBaseQueryResult<
    TData,
    TError,
    CreateStatusBasedQueryResult<'success', TData, TError>
  >
  isError(
    this: CreateBaseQueryResult<TData, TError>,
  ): this is CreateBaseQueryResult<
    TData,
    TError,
    CreateStatusBasedQueryResult<'error', TData, TError>
  >
  isPending(
    this: CreateBaseQueryResult<TData, TError>,
  ): this is CreateBaseQueryResult<
    TData,
    TError,
    CreateStatusBasedQueryResult<'pending', TData, TError>
  >
}

export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
  State = QueryObserverResult<TData, TError>,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<Omit<State, keyof BaseQueryNarrowing>>

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

type CreateStatusBasedMutationResult<
  TStatus extends CreateBaseMutationResult['status'],
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Extract<
  CreateBaseMutationResult<TData, TError, TVariables, TContext>,
  { status: TStatus }
>

export interface BaseMutationNarrowing<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> {
  isSuccess(
    this: CreateMutationResult<TData, TError, TVariables, TContext>,
  ): this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    CreateStatusBasedMutationResult<
      'success',
      TData,
      TError,
      TVariables,
      TContext
    >
  >
  isError(
    this: CreateMutationResult<TData, TError, TVariables, TContext>,
  ): this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    CreateStatusBasedMutationResult<
      'error',
      TData,
      TError,
      TVariables,
      TContext
    >
  >
  isPending(
    this: CreateMutationResult<TData, TError, TVariables, TContext>,
  ): this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    CreateStatusBasedMutationResult<
      'pending',
      TData,
      TError,
      TVariables,
      TContext
    >
  >
  isIdle(
    this: CreateMutationResult<TData, TError, TVariables, TContext>,
  ): this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    CreateStatusBasedMutationResult<'idle', TData, TError, TVariables, TContext>
  >
}

/** Result from createMutation */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
  State = CreateStatusBasedMutationResult<
    CreateBaseMutationResult['status'],
    TData,
    TError,
    TVariables,
    TContext
  >,
> = BaseMutationNarrowing<TData, TError, TVariables, TContext> &
  MapToSignals<Omit<State, keyof BaseMutationNarrowing>>

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
