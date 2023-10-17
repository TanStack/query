import type { QueryClient } from './queryClient'
import type { Query, QueryState } from './query'
import type {
  MutationKey,
  MutationMeta,
  MutationOptions,
  QueryKey,
  QueryMeta,
  QueryOptions,
} from './types'
import type { Mutation, MutationState } from './mutation'

// TYPES

export interface DehydrateOptions {
  shouldDehydrateMutation?: (mutation: Mutation) => boolean
  shouldDehydrateQuery?: (query: Query) => boolean
}

export interface HydrateOptions {
  defaultOptions?: {
    queries?: QueryOptions
    mutations?: MutationOptions
  }
}

interface DehydratedMutation {
  mutationKey?: MutationKey
  state: MutationState
  meta?: MutationMeta
}

interface DehydratedQuery {
  queryHash: string
  queryKey: QueryKey
  state: QueryState
  meta?: QueryMeta
}

export interface DehydratedState {
  mutations: Array<DehydratedMutation>
  queries: Array<DehydratedQuery>
}

// FUNCTIONS

function dehydrateMutation(mutation: Mutation): DehydratedMutation {
  return {
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
    ...(mutation.meta && { meta: mutation.meta }),
  }
}

// Most config is not dehydrated but instead meant to configure again when
// consuming the de/rehydrated data, typically with useQuery on the client.
// Sometimes it might make sense to prefetch data on the server and include
// in the html-payload, but not consume it on the initial render.
function dehydrateQuery(query: Query): DehydratedQuery {
  return {
    state: query.state,
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    ...(query.meta && { meta: query.meta }),
  }
}

export function defaultShouldDehydrateMutation(mutation: Mutation) {
  return mutation.state.isPaused
}

export function defaultShouldDehydrateQuery(query: Query) {
  return query.state.status === 'success'
}

export function dehydrate(
  client: QueryClient,
  options: DehydrateOptions = {},
): DehydratedState {
  const filterMutation =
    options.shouldDehydrateMutation ?? defaultShouldDehydrateMutation

  const mutations = client
    .getMutationCache()
    .getAll()
    .flatMap((mutation) =>
      filterMutation(mutation) ? [dehydrateMutation(mutation)] : [],
    )

  const filterQuery =
    options.shouldDehydrateQuery ?? defaultShouldDehydrateQuery

  const queries = client
    .getQueryCache()
    .getAll()
    .flatMap((query) => (filterQuery(query) ? [dehydrateQuery(query)] : []))

  return { mutations, queries }
}

export function hydrate(
  client: QueryClient,
  dehydratedState: unknown,
  options?: HydrateOptions,
): void {
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return
  }

  const mutationCache = client.getMutationCache()
  const queryCache = client.getQueryCache()

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const mutations = (dehydratedState as DehydratedState).mutations || []
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const queries = (dehydratedState as DehydratedState).queries || []

  mutations.forEach((dehydratedMutation) => {
    mutationCache.build(
      client,
      {
        ...options?.defaultOptions?.mutations,
        mutationKey: dehydratedMutation.mutationKey,
        meta: dehydratedMutation.meta,
      },
      dehydratedMutation.state,
    )
  })

  queries.forEach(({ queryKey, state, queryHash, meta }) => {
    const query = queryCache.get(queryHash)

    // Do not hydrate if an existing query exists with newer data
    if (query) {
      if (query.state.dataUpdatedAt < state.dataUpdatedAt) {
        // omit fetchStatus from dehydrated state
        // so that query stays in its current fetchStatus
        const { fetchStatus: _ignored, ...dehydratedQueryState } = state
        query.setState(dehydratedQueryState)
      }
      return
    }

    // Restore query
    queryCache.build(
      client,
      {
        ...options?.defaultOptions?.queries,
        queryKey,
        queryHash,
        meta,
      },
      // Reset fetch status to idle to avoid
      // query being stuck in fetching state upon hydration
      {
        ...state,
        fetchStatus: 'idle',
      },
    )
  })
}
