import type { QueryClient } from './queryClient'
import type { Query, QueryState } from './query'
import type {
  MutationKey,
  MutationOptions,
  QueryKey,
  QueryOptions,
} from './types'
import type { Mutation, MutationState } from './mutation'

// TYPES

export interface DehydrateOptions {
  dehydrateMutation?: (mutation: Mutation) => boolean
  dehydrateQuery?: (query: Query) => boolean
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
}

interface DehydratedQuery {
  queryHash: string
  queryKey: QueryKey
  state: QueryState
}

export interface DehydratedState {
  mutations: DehydratedMutation[]
  queries: DehydratedQuery[]
}

// FUNCTIONS

function dehydrateMutation(mutation: Mutation): DehydratedMutation {
  return {
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
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
  }
}

export function defaultDehydrateMutation(mutation: Mutation) {
  return mutation.state.isPaused
}

export function defaultDehydrateQuery(query: Query) {
  return query.state.status === 'success'
}

export function dehydrate(
  client: QueryClient,
  options: DehydrateOptions = {},
): DehydratedState {
  const shouldDehydrateMutation =
    options.dehydrateMutation ?? defaultDehydrateMutation

  const mutations = client
    .getMutationCache()
    .getAll()
    .flatMap((mutation) =>
      shouldDehydrateMutation(mutation) ? [dehydrateMutation(mutation)] : [],
    )

  const shouldDehydrateQuery = options.dehydrateQuery ?? defaultDehydrateQuery

  const queries = client
    .getQueryCache()
    .getAll()
    .flatMap((query) =>
      shouldDehydrateQuery(query) ? [dehydrateQuery(query)] : [],
    )

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
      },
      dehydratedMutation.state,
    )
  })

  queries.forEach((dehydratedQuery) => {
    const query = queryCache.get(dehydratedQuery.queryHash)

    // Reset fetch status to idle in the dehydrated state to avoid
    // query being stuck in fetching state upon hydration
    const dehydratedQueryState = {
      ...dehydratedQuery.state,
      fetchStatus: 'idle' as const,
    }

    // Do not hydrate if an existing query exists with newer data
    if (query) {
      if (query.state.dataUpdatedAt < dehydratedQueryState.dataUpdatedAt) {
        query.setState(dehydratedQueryState)
      }
      return
    }

    // Restore query
    queryCache.build(
      client,
      {
        ...options?.defaultOptions?.queries,
        queryKey: dehydratedQuery.queryKey,
        queryHash: dehydratedQuery.queryHash,
      },
      dehydratedQueryState,
    )
  })
}
