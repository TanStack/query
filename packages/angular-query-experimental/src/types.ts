/* istanbul ignore file */

import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Injector, Signal } from '@angular/core'
import type { MapToSignals } from './signal-proxy'

/**
 * @public
 */
export interface CreateBaseQueryOptions<
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
  > {}

/**
 * @public
 */
export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
    CreateBaseQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >,
    'suspense'
  > {}

/**
 * @public
 */
type CreateStatusBasedQueryResult<
  TStatus extends QueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<QueryObserverResult<TData, TError>, { status: TStatus }>

/**
 * @public
 */
export interface BaseQueryNarrowing<TData = unknown, TError = DefaultError> {
  isSuccess: (
    this: CreateBaseQueryResult<TData, TError>,
  ) => this is CreateBaseQueryResult<
    TData,
    TError,
    CreateStatusBasedQueryResult<'success', TData, TError>
  >
  isError: (
    this: CreateBaseQueryResult<TData, TError>,
  ) => this is CreateBaseQueryResult<
    TData,
    TError,
    CreateStatusBasedQueryResult<'error', TData, TError>
  >
  isPending: (
    this: CreateBaseQueryResult<TData, TError>,
  ) => this is CreateBaseQueryResult<
    TData,
    TError,
    CreateStatusBasedQueryResult<'pending', TData, TError>
  >
}

/**
 * @public
 */
export interface CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
    InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >,
    'suspense'
  > {}

/**
 * @public
 */
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
  TState = QueryObserverResult<TData, TError>,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>>

/**
 * @public
 */
export type CreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = CreateBaseQueryResult<TData, TError>

/**
 * @public
 */
export type DefinedCreateQueryResult<
  TData = unknown,
  TError = DefaultError,
  TState = DefinedQueryObserverResult<TData, TError>,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>>

/**
 * @public
 */
export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = MapToSignals<InfiniteQueryObserverResult<TData, TError>>

/**
 * @public
 */
export type DefinedCreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TDefinedInfiniteQueryObserver = DefinedInfiniteQueryObserverResult<
    TData,
    TError
  >,
> = MapToSignals<TDefinedInfiniteQueryObserver>

/**
 * @public
 */
export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

/**
 * @public
 */
export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

/**
 * @public
 */
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

/**
 * @public
 */
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

type SignalFunction<T extends () => any> = T & Signal<ReturnType<T>>

/**
 * @public
 */
export interface BaseMutationNarrowing<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> {
  isSuccess: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TContext>,
    ) => this is CreateMutationResult<
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
  >
  isError: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TContext>,
    ) => this is CreateMutationResult<
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
  >
  isPending: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TContext>,
    ) => this is CreateMutationResult<
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
  >
  isIdle: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TContext>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TContext,
      CreateStatusBasedMutationResult<
        'idle',
        TData,
        TError,
        TVariables,
        TContext
      >
    >
  >
}

/**
 * @public
 */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
  TState = CreateStatusBasedMutationResult<
    CreateBaseMutationResult['status'],
    TData,
    TError,
    TVariables,
    TContext
  >,
> = BaseMutationNarrowing<TData, TError, TVariables, TContext> &
  MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>>

/**
 * @public
 */
export type NonUndefinedGuard<T> = T extends undefined ? never : T

export type WithOptionalInjector = {
  injector?: Injector
}
