import type { Query, QueryCache, QueryKey } from 'react-query'

export interface DehydratedQueryConfig {
  cacheTime?: number
}

export interface DehydratedQuery {
  queryKey: QueryKey
  data?: unknown
  updatedAt: number
  config: DehydratedQueryConfig
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

// Most config is not dehydrated but instead meant to configure again when
// consuming the de/rehydrated data, typically with useQuery on the client.
// Sometimes it might make sense to prefetch data on the server and include
// in the html-payload, but not consume it on the initial render.
function dehydrateQuery<TResult, TError = unknown>(
  query: Query<TResult, TError>
): DehydratedQuery {
  return {
    config: {
      cacheTime: query.cacheTime,
    },
    data: query.state.data,
    queryKey: query.queryKey,
    updatedAt: query.state.updatedAt,
  }
}

function defaultShouldDehydrate<TResult, TError>(
  query: Query<TResult, TError>
) {
  return query.state.status === 'success'
}

export function dehydrate(
  queryCache: QueryCache,
  dehydrateConfig?: DehydrateConfig
): DehydratedState {
  const config = dehydrateConfig || {}
  const shouldDehydrate = config.shouldDehydrate || defaultShouldDehydrate
  const queries: DehydratedQuery[] = []

  queryCache.getQueries().forEach(query => {
    if (shouldDehydrate(query)) {
      queries.push(dehydrateQuery(query))
    }
  })

  return { queries }
}

export function hydrate(
  queryCache: QueryCache,
  dehydratedState: unknown
): void {
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return
  }

  const queries = (dehydratedState as DehydratedState).queries || []

  queries.forEach(dehydratedQuery => {
    const resolvedConfig = queryCache.getResolvedQueryConfig(
      dehydratedQuery.queryKey,
      dehydratedQuery.config
    )

    let query = queryCache.getQueryByHash(resolvedConfig.queryHash)

    // Do not hydrate if an existing query exists with newer data
    if (query && query.state.updatedAt >= dehydratedQuery.updatedAt) {
      return
    }

    if (!query) {
      query = queryCache.createQuery(resolvedConfig)
    }

    query.setData(dehydratedQuery.data, {
      updatedAt: dehydratedQuery.updatedAt,
    })
  })
}
