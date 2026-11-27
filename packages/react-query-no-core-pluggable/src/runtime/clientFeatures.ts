import type { infiniteQueryBehavior } from './infiniteQueryBehavior'
import type { Mutation } from './mutation'
import type { MutationCache } from './mutationCache'
import type { QueryClient } from './queryClient'
import type { QueryClientConfig } from './types'

/** Optional implementations owned by one query client. */
export interface QueryClientFeatures {
  /** Cache and builder shared by mutation observers and hydration. */
  mutations?: {
    cache: MutationCache
    build: typeof Mutation.build
  }
  /** Creates the fetch behavior for a paginated query. */
  infiniteQueryBehavior?: typeof infiniteQueryBehavior
}

/** Installs optional behavior for one client, including caches owned by that client. */
export type QueryClientPlugin = (
  features: QueryClientFeatures,
  config: Readonly<QueryClientConfig>,
) => void

export const clientFeatures = Symbol('clientFeatures')

/**
 * Looks up the mutation implementation for an operation that requires it.
 * @param client - Client receiving the operation.
 * @returns The installed mutation cache and builder.
 * @throws {Error} When mutation support is missing from the client.
 */
export function requireMutations(client: QueryClient) {
  const mutations = client[clientFeatures].mutations
  if (!mutations) {
    throw new Error(
      'Add mutationPlugin to the QueryClient plugins to use mutations.',
    )
  }
  return mutations
}
