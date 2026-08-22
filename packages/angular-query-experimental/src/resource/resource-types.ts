import type { Injector, Resource, Signal } from '@angular/core'
import type {
  DefaultError,
  FetchStatus,
  InfiniteQueryObserverResult,
  MutationStatus,
  QueryKey,
  QueryObserverResult,
  QueryStatus,
} from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateMutateAsyncFunction,
  CreateMutateFunction,
  CreateMutationOptions,
  CreateQueryOptions,
} from '../types'

/**
 * The Angular `Injector` to use when a resource is created outside an injection
 * context.
 */
export interface QueryResourceInjectorOptions {
  injector?: Injector
}

/**
 * The handle returned by `queryResource`.
 *
 * It **is** an Angular read-only `Resource<TData | undefined>` (so it composes with
 * anything that consumes a resource and exposes `value`/`status`/`error`/`isLoading`/
 * `hasValue`/`snapshot`), and additionally exposes the TanStack Query result fields as
 * signals plus imperative cache writes.
 *
 * Naming note: `status` follows Angular's `ResourceStatus`
 * (`idle | loading | reloading | resolved | local | error`). The TanStack
 * `pending | success | error` status is available as {@link queryStatus}. `error`
 * follows the resource contract (`Signal<Error | undefined>`); the typed query error
 * is available via {@link failureReason}.
 */
export interface BaseQueryResource<TData = unknown, TError = DefaultError>
  extends Resource<TData | undefined> {
  /** Last known data — safe to read in any state (never throws), unlike `value`. */
  readonly data: Signal<TData | undefined>
  /** TanStack query status: `pending | success | error`. */
  readonly queryStatus: Signal<QueryStatus>
  /** Fetch lifecycle independent of data: `idle | fetching | paused`. */
  readonly fetchStatus: Signal<FetchStatus>
  readonly isPending: Signal<boolean>
  readonly isSuccess: Signal<boolean>
  readonly isError: Signal<boolean>
  readonly isFetching: Signal<boolean>
  readonly isStale: Signal<boolean>
  readonly isPlaceholderData: Signal<boolean>
  readonly failureCount: Signal<number>
  readonly failureReason: Signal<TError | null>
  readonly dataUpdatedAt: Signal<number>
  readonly errorUpdatedAt: Signal<number>

  /** Manually refetch the query. */
  refetch: QueryObserverResult<TData, TError>['refetch']
  /** Alias for {@link refetch} to mirror the Angular resource API. */
  reload: () => void
  /** Optimistically overwrite the cached value (writes through `setQueryData`). */
  set: (value: TData) => void
  /** Optimistically update the cached value (writes through `setQueryData`). */
  update: (updater: (previous: TData | undefined) => TData) => void
}

export type CreateQueryResourceResult<
  TData = unknown,
  TError = DefaultError,
> = BaseQueryResource<TData, TError>

/** The handle returned by `infiniteQueryResource`. */
export interface CreateInfiniteQueryResourceResult<
  TData = unknown,
  TError = DefaultError,
> extends BaseQueryResource<TData, TError> {
  readonly hasNextPage: Signal<boolean>
  readonly hasPreviousPage: Signal<boolean>
  readonly isFetchingNextPage: Signal<boolean>
  readonly isFetchingPreviousPage: Signal<boolean>
  readonly isFetchNextPageError: Signal<boolean>
  readonly isFetchPreviousPageError: Signal<boolean>
  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage']
  fetchPreviousPage: InfiniteQueryObserverResult<TData, TError>['fetchPreviousPage']
}

/**
 * The "config object" form of query options accepted by `queryResource`.
 *
 * Unlike the options-function form, a plain object literal evaluates its fields
 * eagerly, so the reactive fields must be passed as functions:
 * - `queryKey` may be a `QueryKey` or a `() => QueryKey` thunk (the common case:
 *   dependent / parameterised keys).
 * - `enabled` may be a `boolean` or a `() => boolean` thunk.
 *
 * Anything else is read once. For full whole-object reactivity, pass the
 * options-function form `queryResource(() => ({ ... }))` instead.
 */
export type QueryResourceConfig<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryKey' | 'enabled'
> & {
  queryKey: TQueryKey | (() => TQueryKey)
  enabled?: boolean | (() => boolean)
}

/** The options-function form: whole-object reactive, identical to `injectQuery`. */
export type QueryResourceOptionsFn<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>

/** The "config object" form of options accepted by `infiniteQueryResource`. */
export type InfiniteQueryResourceConfig<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'queryKey' | 'enabled'
> & {
  queryKey: TQueryKey | (() => TQueryKey)
  enabled?: boolean | (() => boolean)
}

/** The options-function form: whole-object reactive, identical to `injectInfiniteQuery`. */
export type InfiniteQueryResourceOptionsFn<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = () => CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

/**
 * The handle returned by `mutationResource`.
 *
 * It **is** an Angular read-only `Resource<TData | undefined>` whose `value` is the
 * result of the most recent mutation, and additionally exposes the mutation result
 * fields as signals plus `mutate` / `mutateAsync` / `reset`.
 *
 * Naming note: `status` follows Angular's `ResourceStatus`; the TanStack mutation
 * status (`idle | pending | success | error`) is available as {@link mutationStatus}.
 */
export interface MutationResource<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends Resource<TData | undefined> {
  /** Result of the most recent mutation — safe to read in any state (never throws). */
  readonly data: Signal<TData | undefined>
  /** TanStack mutation status: `idle | pending | success | error`. */
  readonly mutationStatus: Signal<MutationStatus>
  /** The variables passed to the most recent `mutate` / `mutateAsync` call. */
  readonly variables: Signal<TVariables | undefined>
  readonly submittedAt: Signal<number>
  readonly isIdle: Signal<boolean>
  readonly isPending: Signal<boolean>
  readonly isSuccess: Signal<boolean>
  readonly isError: Signal<boolean>
  readonly failureCount: Signal<number>
  readonly failureReason: Signal<TError | null>

  /** Fire-and-forget mutation; errors surface via the `error` / `isError` signals. */
  mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
  /** Awaitable mutation; rejects on error. */
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>
  /** Reset back to the idle state. */
  reset: () => void
}

/** The "config object" form of options accepted by `mutationResource`. */
export type MutationResourceConfig<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>

/** The options-function form: whole-object reactive, identical to `injectMutation`. */
export type MutationResourceOptionsFn<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = () => CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>
