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
  dehydrateMutations?: boolean
  dehydrateQueries?: boolean
  shouldDehydrateMutation?: ShouldDehydrateMutationFunction
  shouldDehydrateQuery?: ShouldDehydrateQueryFunction
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

export type ShouldDehydrateQueryFunction = (query: Query) => boolean

export type ShouldDehydrateMutationFunction = (mutation: Mutation) => boolean

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
  const mutations: DehydratedMutation[] = []
  const queries: DehydratedQuery[] = []

  if (options.dehydrateMutations !== false) {
    const shouldDehydrateMutation =
      options.shouldDehydrateMutation || defaultShouldDehydrateMutation

    client
      .getMutationCache()
      .getAll()
      .forEach((mutation) => {
        if (shouldDehydrateMutation(mutation)) {
          mutations.push(dehydrateMutation(mutation))
        }
      })
  }

  if (options.dehydrateQueries !== false) {
    const shouldDehydrateQuery =
      options.shouldDehydrateQuery || defaultShouldDehydrateQuery

    client
      .getQueryCache()
      .getAll()
      .forEach((query) => {
        if (shouldDehydrateQuery(query)) {
          queries.push(dehydrateQuery(query))
        }
      })
  }

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

  queries.forEach(({ queryKey, state, queryHash }) => {
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
