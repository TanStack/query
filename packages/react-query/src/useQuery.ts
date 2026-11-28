'use client'

import { defaultQueryOptions } from '@tanstack/query-core'
import * as React from 'react'
import { useIsRestoring } from './IsRestoringProvider'
import { useQueryClient } from './QueryClientProvider'
import { observerKey } from './queryDescriptor'
import { useObserverSnapshot } from './useObserverSnapshot'
import type {
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { InfiniteQueryMode } from './infiniteQueryOptions'
import type { QueryBoundaryPolicy, QueryRenderPolicy } from './queryDescriptor'
import type { QueryMode } from './queryOptions'
import type {
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
export type PreparedQuery = (QueryMode | InfiniteQueryMode) & {
  /** The cache key attached to the prepared fetcher. */
  queryKey: QueryKey
  /** The fetcher or query function token supplied to the factory. */
  queryFn: unknown
  /** Whether this reader should subscribe to future updates. */
  subscribed?: boolean
}

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
  ? T extends { renderPolicy: { suspense: true } }
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
    ? T extends { renderPolicy: { suspense: true } }
      ? UseSuspenseQueryResult<TData, TError>
      : HasInitialData<T, Exclude<TQueryFnData, undefined>> extends true
        ? DefinedUseQueryResult<TData, TError>
        : UseQueryResult<TData, TError>
    : T extends InfiniteQueryMode
      ? UseInfiniteQueryResult
      : UseQueryResult

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
  options: PreparedQuery | null | undefined,
  queryClient?: QueryClient,
) {
  if (!options?.[observerKey]) {
    throw new TypeError(
      process.env.NODE_ENV === 'production'
        ? 'Expected a query options descriptor.'
        : 'Bad argument type. Pass a descriptor from queryOptions, suspenseQueryOptions, infiniteQueryOptions, or suspenseInfiniteQueryOptions.',
    )
  }

  const Observer = options[observerKey] as typeof QueryObserver
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()

  const policy: QueryRenderPolicy = options.renderPolicy
  const defaulted = defaultQueryOptions(client, {
    ...(options as AnyUseQueryOptions),
    suspense: policy.suspense,
  })
  if (process.env.NODE_ENV !== 'production' && !defaulted.queryFn) {
    console.error(
      `[${defaulted.queryHash}]: No query function was provided or configured in the query defaults. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`,
    )
  }
  const subscribed = options.subscribed !== false
  defaulted._optimisticResults = isRestoring
    ? 'isRestoring'
    : subscribed
      ? 'optimistic'
      : undefined
  policy.prepare?.(defaulted)
  const rule = defaulted.throwOnError
  const boundaryPolicy =
    policy.errorBoundary ??
    (typeof rule === 'object' ? (rule[0] as QueryBoundaryPolicy) : undefined)
  if (process.env.NODE_ENV !== 'production' && rule && !boundaryPolicy)
    throw new TypeError(
      'Pass [throwOnError, true] or [throwOnError, predicate] to a query.',
    )
  const boundary = boundaryPolicy && React.use(boundaryPolicy.context)
  const handling =
    boundary && boundaryPolicy.prepare(client, defaulted, boundary)
  const onCommit = handling?.onCommit
  React.useEffect(() => onCommit?.(), [onCommit])

  const createObserver = () => ({
    client,
    Observer,
    observer: new Observer(client, defaulted),
  })
  const [saved, setSaved] = React.useState(createObserver)
  let current = saved
  if (current.Observer !== Observer || current.client !== client) {
    current = createObserver()
    setSaved(current)
  }

  const { observer } = current
  const reader = observer.createResultReader(defaulted)
  if (boundary)
    policy.readQuery?.(defaulted, reader, observer, client, boundary)
  const result = useObserverSnapshot(
    observer,
    reader,
    !isRestoring && subscribed,
    refreshQuery,
  )
  handling?.check(result)
  return defaulted.notifyOnChangeProps ? result : observer.trackResult(result)
}

/**
 * Reads updates queued between render and subscription.
 * @param observer - The newly subscribed observer.
 */
function refreshQuery(observer: Pick<QueryObserver, 'updateResult'>) {
  observer.updateResult()
}
