import { skipToken } from '@tanstack/query-core/primitives'
import { defaultThrowOnError, suspenseQueryPolicy } from './suspense'
import type { DefaultError, QueryKey, SkipToken } from '@tanstack/query-core'
import type { InfiniteQueryMode } from './infiniteQuery'
import type { UseSuspenseQueryOptions } from './types'
import type { SkippableSuspenseQueryOptions } from './useSuspenseQuery'

/** The render policy attached to options prepared with `suspenseQuery`. */
export interface SuspenseQueryMode<TSkippable extends boolean = false> {
  /** Skipping the query disables its Suspense policy for this render. */
  readonly renderPolicy: TSkippable extends true
    ? typeof suspenseQueryPolicy | undefined
    : typeof suspenseQueryPolicy
}

/** Options that make a single enabled query read through React Suspense. */
export type SuspenseQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
  SuspenseQueryMode

/**
 * Applies the Suspense render policy to a paginated query.
 * @param options - An infinite query prepared with `infiniteQuery`.
 * @returns The same paginated options with the policy for a running or skipped query.
 */
export function suspenseQuery<
  TOptions extends InfiniteQueryMode & { queryFn?: unknown },
>(
  options: TOptions,
): TOptions &
  SuspenseQueryMode<SkipToken extends TOptions['queryFn'] ? true : false>

/**
 * Lets `useQuery` suspend while fetching a query without data. A failed query
 * without data throws to the nearest error boundary. An observer can reuse
 * data already cached by a regular query with the same key.
 * @param options - Query options. The Suspense policy controls enabled and throwOnError.
 * @returns Options for `useQuery`. A running query returns defined data.
 */
export function suspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): SuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>

/**
 * Supports a query function that may be `skipToken`.
 * @param options - Passing `skipToken` keeps the observer disabled.
 * @returns Options for `useQuery`. A skipped query can return undefined data.
 */
export function suspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SkippableSuspenseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): SkippableSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
  SuspenseQueryMode<true>

export function suspenseQuery<TOptions extends { queryFn?: unknown }>(
  options: TOptions,
): TOptions & {
  readonly renderPolicy: typeof suspenseQueryPolicy | undefined
  enabled?: boolean
  throwOnError?: typeof defaultThrowOnError
} {
  const enabled = options.queryFn !== skipToken
  return {
    ...options,
    enabled,
    throwOnError: defaultThrowOnError,
    renderPolicy: enabled ? suspenseQueryPolicy : undefined,
  }
}
