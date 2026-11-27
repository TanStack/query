'use client'

import { observerKey } from './queryDescriptor'
import { useBaseQuery } from './useBaseQuery'
import type {
  InfiniteData,
  QueryClient,
  QueryObserver,
} from '@tanstack/query-core-pluggable'
import type { InfiniteQueryMode } from './infiniteQueryOptions'
import type { QueryMode } from './queryOptions'
import type { suspenseQueryPolicy } from './suspense'
import type {
  AnyUseInfiniteQueryOptions,
  AnyUseQueryOptions,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from './types'

/** A regular or paginated observer descriptor produced by the React option factories. */
export type PreparedQuery =
  | (AnyUseQueryOptions & QueryMode)
  | (AnyUseInfiniteQueryOptions & InfiniteQueryMode)

type HasInitialData<T, TQueryData> = T extends {
  initialData: TQueryData | (() => TQueryData)
}
  ? true
  : false

type PreparedQueryResult<T> = T extends InfiniteQueryMode &
  UseInfiniteQueryOptions<
    infer TPage,
    infer TError,
    infer TData,
    any,
    infer TPageParam
  >
  ? T extends { renderPolicy: typeof suspenseQueryPolicy }
    ? UseSuspenseInfiniteQueryResult<TData, TError>
    : HasInitialData<T, InfiniteData<TPage, TPageParam>> extends true
      ? DefinedUseInfiniteQueryResult<TData, TError>
      : UseInfiniteQueryResult<TData, TError>
  : T extends UseQueryOptions<
        infer TQueryFnData,
        infer TError,
        infer TData,
        any
      >
    ? T extends { renderPolicy: typeof suspenseQueryPolicy }
      ? UseSuspenseQueryResult<TData, TError>
      : HasInitialData<T, Exclude<TQueryFnData, undefined>> extends true
        ? DefinedUseQueryResult<TData, TError>
        : UseQueryResult<TData, TError>
    : never

/**
 * Reads a descriptor produced by queryOptions, suspenseQueryOptions, infiniteQueryOptions, or suspenseInfiniteQueryOptions. Its factory selects the observer and render policy.
 * @param options - Query options prepared for the selected observer and render policy.
 * @param queryClient - The client to use. Defaults to the nearest provider.
 * @returns The result for the selected query, including pagination controls for infinite queries.
 */
export function useQuery<T extends PreparedQuery>(
  options: T,
  queryClient?: QueryClient,
): PreparedQueryResult<T>

export function useQuery(
  options:
    | ((AnyUseQueryOptions | AnyUseInfiniteQueryOptions) & {
        [observerKey]?: PreparedQuery[typeof observerKey]
        renderPolicy?: typeof suspenseQueryPolicy
      })
    | null
    | undefined,
  queryClient?: QueryClient,
) {
  const Observer = options?.[observerKey]
  if (!Observer) {
    throw new TypeError(
      process.env.NODE_ENV === 'production'
        ? 'Expected a query options descriptor.'
        : 'Bad argument type. Pass a descriptor from queryOptions, suspenseQueryOptions, infiniteQueryOptions, or suspenseInfiniteQueryOptions.',
    )
  }
  return useBaseQuery(
    options as AnyUseQueryOptions,
    Observer as typeof QueryObserver,
    queryClient,
    options.renderPolicy,
  )
}
