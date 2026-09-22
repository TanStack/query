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
import type { MapToSignals } from './utils/signal-proxy'
import type {
  InfiniteQueryResultFields,
  MutationResultFields,
  QueryResultFields,
} from './utils/result-fields'

type SignalFunction<T extends () => any> = T & Signal<ReturnType<T>>

export type CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'notifyOnChangeProps' | 'suspense' | 'throwOnError'
>

type CreateStatusBasedQueryResult<
  TStatus extends QueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<QueryObserverResult<TData, TError>, { status: TStatus }>

type CreateStatusBasedDefinedQueryResult<
  TStatus extends DefinedQueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<DefinedQueryObserverResult<TData, TError>, { status: TStatus }>

type CreateStatusBasedInfiniteQueryResult<
  TStatus extends InfiniteQueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<InfiniteQueryObserverResult<TData, TError>, { status: TStatus }>

type CreateStatusBasedDefinedInfiniteQueryResult<
  TStatus extends DefinedInfiniteQueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<
  DefinedInfiniteQueryObserverResult<TData, TError>,
  { status: TStatus }
>

export interface BaseQueryNarrowing<TData = unknown, TError = DefaultError> {
  isSuccess: SignalFunction<
    (
      this: CreateBaseQueryResult<TData, TError>,
    ) => this is CreateBaseQueryResult<
      TData,
      TError,
      CreateStatusBasedQueryResult<'success', TData, TError>
    >
  >
  isError: SignalFunction<
    (
      this: CreateBaseQueryResult<TData, TError>,
    ) => this is CreateBaseQueryResult<
      TData,
      TError,
      CreateStatusBasedQueryResult<'error', TData, TError>
    >
  >
  isPending: SignalFunction<
    (
      this: CreateBaseQueryResult<TData, TError>,
    ) => this is CreateBaseQueryResult<
      TData,
      TError,
      CreateStatusBasedQueryResult<'pending', TData, TError>
    >
  >
}

export interface DefinedQueryNarrowing<TData = unknown, TError = DefaultError> {
  isSuccess: SignalFunction<
    (
      this: DefinedCreateQueryResult<TData, TError>,
    ) => this is DefinedCreateQueryResult<
      TData,
      TError,
      CreateStatusBasedDefinedQueryResult<'success', TData, TError>
    >
  >
  isError: SignalFunction<
    (
      this: DefinedCreateQueryResult<TData, TError>,
    ) => this is DefinedCreateQueryResult<
      TData,
      TError,
      CreateStatusBasedDefinedQueryResult<'error', TData, TError>
    >
  >
  isPending: SignalFunction<
    (this: DefinedCreateQueryResult<TData, TError>) => this is never
  >
}

export interface BaseInfiniteQueryNarrowing<
  TData = unknown,
  TError = DefaultError,
> {
  isSuccess: SignalFunction<
    (
      this: CreateInfiniteQueryResult<TData, TError>,
    ) => this is CreateInfiniteQueryResult<
      TData,
      TError,
      CreateStatusBasedInfiniteQueryResult<'success', TData, TError>
    >
  >
  isError: SignalFunction<
    (
      this: CreateInfiniteQueryResult<TData, TError>,
    ) => this is CreateInfiniteQueryResult<
      TData,
      TError,
      CreateStatusBasedInfiniteQueryResult<'error', TData, TError>
    >
  >
  isPending: SignalFunction<
    (
      this: CreateInfiniteQueryResult<TData, TError>,
    ) => this is CreateInfiniteQueryResult<
      TData,
      TError,
      CreateStatusBasedInfiniteQueryResult<'pending', TData, TError>
    >
  >
}

export interface DefinedInfiniteQueryNarrowing<
  TData = unknown,
  TError = DefaultError,
> {
  isSuccess: SignalFunction<
    (
      this: DefinedCreateInfiniteQueryResult<TData, TError>,
    ) => this is DefinedCreateInfiniteQueryResult<
      TData,
      TError,
      CreateStatusBasedDefinedInfiniteQueryResult<'success', TData, TError>
    >
  >
  isError: SignalFunction<
    (
      this: DefinedCreateInfiniteQueryResult<TData, TError>,
    ) => this is DefinedCreateInfiniteQueryResult<
      TData,
      TError,
      CreateStatusBasedDefinedInfiniteQueryResult<'error', TData, TError>
    >
  >
  isPending: SignalFunction<
    (this: DefinedCreateInfiniteQueryResult<TData, TError>) => this is never
  >
}

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
  'notifyOnChangeProps' | 'suspense' | 'throwOnError'
> {}

/**
 * The result of `injectQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
 * `pending`. Same shape as {@link QueryObserverResult} from `@tanstack/query-core`, but value fields (like
 * `data`, `error`, `status`) are exposed as a `Signal` — read them with `query.data()`, not `query.data` —
 * while function fields (like `refetch`) are called directly, unchanged. `isSuccess`/`isError`/`isPending`
 * are {@link BaseQueryNarrowing} type-guard methods rather than plain booleans.
 * `injectInfiniteQuery` returns {@link CreateInfiniteQueryResult} instead.
 *
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
  TState extends QueryObserverResult<TData, TError> = QueryObserverResult<
    TData,
    TError
  >,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<
    OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>,
    QueryResultFields
  >

/**
 * The result of `injectQuery`. Same as {@link CreateBaseQueryResult}.
 *
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type CreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = CreateBaseQueryResult<TData, TError>

/**
 * The result of `injectQuery` when `initialData` is set — `data` is never `undefined`. Same shape as
 * {@link DefinedQueryObserverResult} from `@tanstack/query-core`, but value fields are exposed as a
 * `Signal` while function fields are called directly, unchanged.
 *
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type DefinedCreateQueryResult<
  TData = unknown,
  TError = DefaultError,
  TState extends DefinedQueryObserverResult<TData, TError> =
    DefinedQueryObserverResult<TData, TError>,
> = DefinedQueryNarrowing<TData, TError> &
  MapToSignals<
    OmitKeyof<TState, keyof DefinedQueryNarrowing, 'safely'>,
    QueryResultFields
  >

/**
 * The result of `injectInfiniteQuery` when `initialData` isn't set — `data` may be `undefined` while the
 * query is `pending`. Same shape as {@link InfiniteQueryObserverResult} from `@tanstack/query-core`, but
 * value fields are exposed as a `Signal` while function fields (like `fetchNextPage`) are called directly,
 * unchanged.
 *
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TState extends InfiniteQueryObserverResult<TData, TError> =
    InfiniteQueryObserverResult<TData, TError>,
> = BaseInfiniteQueryNarrowing<TData, TError> &
  MapToSignals<TState, InfiniteQueryResultFields>

/**
 * The result of `injectInfiniteQuery` when `initialData` is set — `data` is never `undefined`. Same shape as
 * {@link DefinedInfiniteQueryObserverResult} from `@tanstack/query-core`, but value fields are exposed as a
 * `Signal` while function fields are called directly, unchanged.
 *
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type DefinedCreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TDefinedInfiniteQueryObserver extends DefinedInfiniteQueryObserverResult<
    TData,
    TError
  > = DefinedInfiniteQueryObserverResult<TData, TError>,
> = DefinedInfiniteQueryNarrowing<TData, TError> &
  MapToSignals<TDefinedInfiniteQueryObserver, InfiniteQueryResultFields>

/**
 * The options accepted by `injectMutation`. Same as {@link MutationObserverOptions} from
 * `@tanstack/query-core`, minus the internal `_defaulted` flag.
 *
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export interface CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted' | 'throwOnError'
> {}

/**
 * The type of `mutate`, as returned by `injectMutation`. Forwards the variables (and an optional per-call
 * `onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
 * through the mutation result, not thrown.
 *
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
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
 * The type of `mutateAsync`, as returned by `injectMutation`. Similar to {@link CreateMutateFunction}, but
 * returns a promise which can be awaited.
 *
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>

/**
 * The pre-`Signal` shape {@link CreateMutationResult} is built from — not what `injectMutation` actually
 * returns. Same as {@link MutationObserverResult} from `@tanstack/query-core`, with `mutate` narrowed to the
 * fire-and-forget {@link CreateMutateFunction} signature, plus the added `mutateAsync`.
 *
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
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
  /**
   * Similar to `mutate`, but returns a promise which can be awaited.
   */
  mutateAsync: CreateMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

type CreateStatusBasedMutationResult<
  TStatus extends CreateBaseMutationResult['status'],
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Extract<
  CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult>,
  { status: TStatus }
>

export interface BaseMutationNarrowing<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> {
  isSuccess: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TOnMutateResult>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult,
      CreateStatusBasedMutationResult<
        'success',
        TData,
        TError,
        TVariables,
        TOnMutateResult
      >
    >
  >
  isError: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TOnMutateResult>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult,
      CreateStatusBasedMutationResult<
        'error',
        TData,
        TError,
        TVariables,
        TOnMutateResult
      >
    >
  >
  isPending: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TOnMutateResult>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult,
      CreateStatusBasedMutationResult<
        'pending',
        TData,
        TError,
        TVariables,
        TOnMutateResult
      >
    >
  >
  isIdle: SignalFunction<
    (
      this: CreateMutationResult<TData, TError, TVariables, TOnMutateResult>,
    ) => this is CreateMutationResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult,
      CreateStatusBasedMutationResult<
        'idle',
        TData,
        TError,
        TVariables,
        TOnMutateResult
      >
    >
  >
}

/**
 * The result of `injectMutation`. Based on {@link CreateBaseMutationResult}, but value fields are exposed as
 * a `Signal` — read them with `mutation.data()`, not `mutation.data` — while function fields (`mutate`,
 * `mutateAsync`, `reset`) are called directly, unchanged. `isSuccess`/`isError`/`isPending`/`isIdle` are
 * {@link BaseMutationNarrowing} type-guard methods rather than plain booleans.
 *
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
  TState = CreateStatusBasedMutationResult<
    CreateBaseMutationResult['status'],
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
> = BaseMutationNarrowing<TData, TError, TVariables, TOnMutateResult> &
  MapToSignals<
    OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>,
    MutationResultFields
  >
