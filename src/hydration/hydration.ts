import { Query } from '../core/query'
import { QueryCache } from '../core/queryCache'
import { QueryKey, QueryOptions } from '../core/types'

// TYPES

export interface DehydrateOptions {
  shouldDehydrate?: ShouldDehydrateFunction
}

export interface HydrateOptions {
  defaultOptions?: QueryOptions
}

interface DehydratedQueryConfig {
  cacheTime: number
}

interface DehydratedQuery {
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

// FUNCTIONS

function serializePositiveNumber(value: number): number {
  return value === Infinity ? -1 : value
}

function deserializePositiveNumber(value: number): number {
  return value === -1 ? Infinity : value
}

// Most config is not dehydrated but instead meant to configure again when
// consuming the de/rehydrated data, typically with useQuery on the client.
// Sometimes it might make sense to prefetch data on the server and include
// in the html-payload, but not consume it on the initial render.
function dehydrateQuery(query: Query): DehydratedQuery {
  return {
    config: {
      cacheTime: serializePositiveNumber(query.cacheTime),
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
  options?: DehydrateOptions
): DehydratedState {
  options = options || {}

  const shouldDehydrate = options.shouldDehydrate || defaultShouldDehydrate
  const queries: DehydratedQuery[] = []

  cache.getAll().forEach(query => {
    if (shouldDehydrate(query)) {
      queries.push(dehydrateQuery(query))
    }
  })

  return { queries }
}

export function hydrate(
  cache: QueryCache,
  dehydratedState: unknown,
  options?: HydrateOptions
): void {
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return
  }

  const defaultOptions = options?.defaultOptions || {}
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
          ...defaultOptions,
          cacheTime: deserializePositiveNumber(
            dehydratedQuery.config.cacheTime
          ),
        },
      })
      cache.add(query)
    }

    query.setData(dehydratedQuery.data, {
      updatedAt: dehydratedQuery.updatedAt,
    })
  })
}
