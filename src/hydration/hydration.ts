import { Query, QueryCache, QueryKey } from '../core'

export interface DehydratedQueryConfig {
  cacheTime: number
}

export interface DehydratedQuery {
  queryKey: QueryKey
  queryHash: string
  data?: unknown
  updatedAt: number
  config: DehydratedQueryConfig
}

export interface DehydratedState {
  queries: Array<DehydratedQuery>
}

export type ShouldDehydrateFunction = (query: Query) => boolean

export interface DehydrateConfig {
  shouldDehydrate?: ShouldDehydrateFunction
}

// Most config is not dehydrated but instead meant to configure again when
// consuming the de/rehydrated data, typically with useQuery on the client.
// Sometimes it might make sense to prefetch data on the server and include
// in the html-payload, but not consume it on the initial render.
function dehydrateQuery(query: Query): DehydratedQuery {
  return {
    config: {
      cacheTime: query.cacheTime,
    },
    data: query.state.data,
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    updatedAt: query.state.updatedAt,
  }
}

function defaultShouldDehydrate(query: Query) {
  return query.state.status === 'success'
}

export function dehydrate(
  cache: QueryCache,
  dehydrateConfig?: DehydrateConfig
): DehydratedState {
  const config = dehydrateConfig || {}
  const shouldDehydrate = config.shouldDehydrate || defaultShouldDehydrate
  const queries: DehydratedQuery[] = []

  cache.getAll().forEach(query => {
    if (shouldDehydrate(query)) {
      queries.push(dehydrateQuery(query))
    }
  })

  return { queries }
}

export function hydrate(cache: QueryCache, dehydratedState: unknown): void {
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return
  }

  const queries = (dehydratedState as DehydratedState).queries || []

  queries.forEach(dehydratedQuery => {
    let query = cache.get(dehydratedQuery.queryHash)

    // Do not hydrate if an existing query exists with newer data
    if (query && query.state.updatedAt >= dehydratedQuery.updatedAt) {
      return
    }

    if (!query) {
      query = new Query({
        cache: cache,
        queryKey: dehydratedQuery.queryKey,
        queryHash: dehydratedQuery.queryHash,
        options: {
          cacheTime: dehydratedQuery.config.cacheTime,
        },
      })
      cache.add(query)
    }

    query.setData(dehydratedQuery.data, {
      updatedAt: dehydratedQuery.updatedAt,
    })
  })
}
