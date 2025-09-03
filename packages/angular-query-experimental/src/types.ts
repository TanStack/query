/* istanbul ignore file */

import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Signal } from '@angular/core'
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
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<InfiniteQueryObserverResult<TData, TError>>

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

export interface CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
> extends OmitKeyof<
    MutationObserverOptions<TData, TError, TVariables, TScope>,
    '_defaulted'
  > {}

/**
 * @public
 */
export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TScope>>
) => void

/**
 * @public
 */
export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
> = MutateFunction<TData, TError, TVariables, TScope>

/**
 * @public
 */
export type CreateBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TScope = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TScope>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TScope> }
> & {
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TScope>
}

/**
 * @public
 */
type CreateStatusBasedMutationResult<
  TStatus extends CreateBaseMutationResult['status'],
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TScope = unknown,
> = Extract<
  CreateBaseMutationResult<TData, TError, TVariables, TScope>,
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
  TScope = unknown,
> {
  isSuccess: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TScope>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TScope,
      CreateStatusBasedMutationResult<
        'success',
        TData,
        TError,
        TVariables,
        TScope
      >
    >
  >
  isError: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TScope>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TScope,
      CreateStatusBasedMutationResult<
        'error',
        TData,
        TError,
        TVariables,
        TScope
      >
    >
  >
  isPending: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TScope>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TScope,
      CreateStatusBasedMutationResult<
        'pending',
        TData,
        TError,
        TVariables,
        TScope
      >
    >
  >
  isIdle: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TScope>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TScope,
      CreateStatusBasedMutationResult<'idle', TData, TError, TVariables, TScope>
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
  TScope = unknown,
  TState = CreateStatusBasedMutationResult<
    CreateBaseMutationResult['status'],
    TData,
    TError,
    TVariables,
    TScope
  >,
> = BaseMutationNarrowing<TData, TError, TVariables, TScope> &
  MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>>
