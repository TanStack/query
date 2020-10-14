import type { QueryClient } from '../core/queryClient'
import { Query, QueryState } from '../core/query'
import type { QueryKey, QueryOptions } from '../core/types'

// TYPES

export interface DehydrateOptions {
  shouldDehydrateQuery?: ShouldDehydrateQueryFunction
}

export interface HydrateOptions {
  defaultOptions?: QueryOptions
}

interface DehydratedQuery {
  cacheTime: number
  queryHash: string
  queryKey: QueryKey
  state: QueryState
}

export interface DehydratedState {
  queries: DehydratedQuery[]
}

export type ShouldDehydrateQueryFunction = (query: Query) => boolean

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
    cacheTime: serializePositiveNumber(query.cacheTime),
    state: query.state,
    queryKey: query.queryKey,
    queryHash: query.queryHash,
  }
}

function defaultShouldDehydrate(query: Query) {
  return query.state.status === 'success'
}

export function dehydrate(
  client: QueryClient,
  options?: DehydrateOptions
): DehydratedState {
  options = options || {}

  const shouldDehydrateQuery =
    options.shouldDehydrateQuery || defaultShouldDehydrate

  const queries: DehydratedQuery[] = []

  client
    .getQueryCache()
    .getAll()
    .forEach(query => {
      if (shouldDehydrateQuery(query)) {
        queries.push(dehydrateQuery(query))
      }
    })

  return { queries }
}

export function hydrate(
  client: QueryClient,
  dehydratedState: unknown,
  options?: HydrateOptions
): void {
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return
  }

  const queryCache = client.getQueryCache()
  const queries = (dehydratedState as DehydratedState).queries || []

  queries.forEach(dehydratedQuery => {
    const query = queryCache.get(dehydratedQuery.queryHash)

    // Do not hydrate if an existing query exists with newer data
    if (query) {
      if (query.state.updatedAt < dehydratedQuery.state.updatedAt) {
        query.setState(dehydratedQuery.state)
      }
      return
    }

    // Restore query
    queryCache.build(
      client,
      {
        ...options?.defaultOptions,
        queryKey: dehydratedQuery.queryKey,
        queryHash: dehydratedQuery.queryHash,
        cacheTime: deserializePositiveNumber(dehydratedQuery.cacheTime),
      },
      dehydratedQuery.state
    )
  })
}
