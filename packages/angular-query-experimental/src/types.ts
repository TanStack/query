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
 * The options shared across `angular-query-experimental`'s query functions. Extends
 * {@link QueryObserverOptions} from `@tanstack/query-core` as-is — unlike `react-query`,
 * `angular-query-experimental` has no extra framework-specific option here.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryData - The type of the data actually held in the query cache — the input to `select` and
 * `placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.
 * @template TQueryKey - The type of your `queryKey`.
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
 * The options accepted by `injectQuery`. Same as {@link CreateBaseQueryOptions}, minus `suspense` — which
 * `angular-query-experimental` doesn't support, unlike `react-query`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'suspense'
> {}

type CreateStatusBasedQueryResult<
  TStatus extends QueryObserverResult['status'],
  TData = unknown,
  TError = DefaultError,
> = Extract<QueryObserverResult<TData, TError>, { status: TStatus }>

/**
 * The `isSuccess`/`isError`/`isPending` methods on a query result. Unlike `react-query`'s derived booleans,
 * these are type-guard methods you call — `if (query.isSuccess())` — so that `query.data` narrows away
 * `undefined` inside the branch, the same way `status` narrowing works on the plain object `react-query`
 * returns.
 *
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
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
 * The options accepted by `injectInfiniteQuery`. Same as {@link CreateBaseQueryOptions}, minus `suspense` —
 * which `angular-query-experimental` doesn't support, unlike `react-query` — extends
 * {@link InfiniteQueryObserverOptions} from `@tanstack/query-core` for the infinite-query-specific options
 * (`getNextPageParam`, `initialPageParam`, etc.).
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` here, though
 * `injectInfiniteQuery` itself defaults it to `InfiniteData<TQueryFnData>` — the shape `data` actually has
 * when no `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
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
  TState = QueryObserverResult<TData, TError>,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>>

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
  TState = DefinedQueryObserverResult<TData, TError>,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>>

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
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<InfiniteQueryObserverResult<TData, TError>>

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
  TDefinedInfiniteQueryObserver = DefinedInfiniteQueryObserverResult<
    TData,
    TError
  >,
> = MapToSignals<TDefinedInfiniteQueryObserver>

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
  '_defaulted'
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

type SignalFunction<T extends () => any> = T & Signal<ReturnType<T>>

/**
 * The `isSuccess`/`isError`/`isPending`/`isIdle` methods on a mutation result. Each is both a `Signal`
 * (its current boolean value is read reactively without calling it) and a type-guard function you can
 * call — `if (mutation.isSuccess())` — so that `mutation.data` narrows away `undefined` inside the branch.
 *
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
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
  MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>>
