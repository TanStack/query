import { DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME } from '../core/config'

import type { Query, QueryCache, QueryKey, QueryConfig } from 'react-query'

export interface DehydratedQueryConfig {
  staleTime?: number
  cacheTime?: number
  initialData?: unknown
}

export interface DehydratedQuery {
  config: DehydratedQueryConfig
  updatedAt: number
}

export interface DehydratedQueries {
  [hash: string]: DehydratedQuery
}

export type QueryKeyParserFunction = (queryHash: string) => QueryKey
export type ShouldHydrateFunction = ({
  queryKey,
  updatedAt,
  staleTime,
  cacheTime,
  data,
}: {
  queryKey: QueryKey
  updatedAt: number
  staleTime: number
  cacheTime: number
  data?: unknown
}) => boolean
export interface HydrateConfig {
  queryKeyParserFn?: QueryKeyParserFunction
  shouldHydrate?: ShouldHydrateFunction
}

export type ShouldDehydrateFunction = <TResult, TError = unknown>(
  query: Query<TResult, TError>
) => boolean
export interface DehydrateConfig {
  shouldDehydrate?: ShouldDehydrateFunction
}

function dehydrateQuery<TResult, TError = unknown>(
  query: Query<TResult, TError>
): DehydratedQuery {
  const dehydratedQuery: DehydratedQuery = {
    config: {},
    updatedAt: query.state.updatedAt,
  }

  // Most config is not dehydrated but instead meant to configure again when
  // consuming the de/rehydrated data, typically with useQuery on the client.
  // Sometimes it might make sense to prefetch data on the server and include
  // in the html-payload, but not consume it on the initial render.
  // We still schedule stale and garbage collection right away, which means
  // we need to specifically include staleTime and cacheTime in dehydration.
  if (query.config.staleTime !== DEFAULT_STALE_TIME) {
    dehydratedQuery.config.staleTime = query.config.staleTime
  }
  if (query.config.cacheTime !== DEFAULT_CACHE_TIME) {
    dehydratedQuery.config.cacheTime = query.config.cacheTime
  }
  if (query.state.data !== undefined) {
    dehydratedQuery.config.initialData = query.state.data
  }

  return dehydratedQuery
}

const defaultShouldDehydrate: ShouldDehydrateFunction = query =>
  query.state.status === 'success'

export function dehydrate(
  queryCache: QueryCache,
  dehydrateConfig?: DehydrateConfig
): DehydratedQueries {
  const config = dehydrateConfig || {}
  const { shouldDehydrate = defaultShouldDehydrate } = config
  const dehydratedQueries: DehydratedQueries = {}
  for (const [queryHash, query] of Object.entries(queryCache.queries)) {
    if (shouldDehydrate(query)) {
      dehydratedQueries[queryHash] = dehydrateQuery(query)
    }
  }

  return dehydratedQueries
}

export function hydrate<TResult>(
  queryCache: QueryCache,
  dehydratedQueries: unknown,
  hydrateConfig?: HydrateConfig
): void {
  const config = hydrateConfig || {}
  const { queryKeyParserFn = JSON.parse, shouldHydrate } = config
  if (typeof dehydratedQueries !== 'object' || dehydratedQueries === null) {
    return
  }

  for (const [queryHash, dehydratedQuery] of Object.entries(
    dehydratedQueries
  )) {
    const queryKey = queryKeyParserFn(queryHash)
    const queryConfig: QueryConfig<TResult> = dehydratedQuery.config

    if (
      shouldHydrate &&
      !shouldHydrate({
        queryKey,
        updatedAt: dehydratedQuery.updatedAt,
        staleTime: queryConfig.staleTime || DEFAULT_STALE_TIME,
        cacheTime: queryConfig.cacheTime || DEFAULT_CACHE_TIME,
        data: queryConfig.initialData,
      })
    ) {
      continue
    }

    queryCache.buildQuery(queryKey, queryConfig)
    const query = queryCache.queries[queryHash]
    query.state.updatedAt = dehydratedQuery.updatedAt
    query.activateGarbageCollectionTimeout()
  }
}
