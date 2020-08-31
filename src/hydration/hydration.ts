import { DEFAULT_CACHE_TIME } from '../core/config'

import type { Query, QueryCache, QueryKey, QueryConfig } from 'react-query'

export interface DehydratedQueryConfig {
  queryKey: QueryKey
  cacheTime?: number
  initialData?: unknown
}

export interface DehydratedQuery {
  config: DehydratedQueryConfig
  updatedAt: number
}

export interface DehydratedState {
  queries: Array<DehydratedQuery>
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
    config: {
      queryKey: query.queryKey,
    },
    updatedAt: query.state.updatedAt,
  }

  // Most config is not dehydrated but instead meant to configure again when
  // consuming the de/rehydrated data, typically with useQuery on the client.
  // Sometimes it might make sense to prefetch data on the server and include
  // in the html-payload, but not consume it on the initial render.
  // We still schedule stale and garbage collection right away, which means
  // we need to specifically include staleTime and cacheTime in dehydration.
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
): DehydratedState {
  const config = dehydrateConfig || {}
  const { shouldDehydrate = defaultShouldDehydrate } = config
  const dehydratedState: DehydratedState = {
    queries: [],
  }
  for (const query of Object.values(queryCache.queries)) {
    if (shouldDehydrate(query)) {
      dehydratedState.queries.push(dehydrateQuery(query))
    }
  }

  return dehydratedState
}

export function hydrate<TResult>(
  queryCache: QueryCache,
  dehydratedState: unknown
): void {
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return
  }

  const queries = (dehydratedState as DehydratedState).queries || []

  for (const dehydratedQuery of queries) {
    const queryKey = dehydratedQuery.config.queryKey
    const queryConfig: QueryConfig<TResult> = dehydratedQuery.config as QueryConfig<
      TResult
    >

    const query = queryCache.buildQuery(queryKey, queryConfig)
    query.state.updatedAt = dehydratedQuery.updatedAt
  }
}
