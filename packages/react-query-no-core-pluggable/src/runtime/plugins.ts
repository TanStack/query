import { infiniteQueryBehavior } from './infiniteQueryBehavior'
import { Mutation } from './mutation'
import { MutationCache } from './mutationCache'
import type { QueryClientPlugin } from './clientFeatures'

/**
 * Enables mutation observers, caching and hydration on one client.
 * @param features - The features being configured for this client.
 * @param config - Client options, including any supplied mutation cache.
 */
export const mutationPlugin: QueryClientPlugin = (features, config) => {
  features.mutations = {
    cache: config.mutationCache ?? new MutationCache(),
    build: Mutation.build,
  }
}

/**
 * Enables page fetching for infinite queries on one client.
 * @param features - The features being configured for this client.
 */
export const infiniteQueryPlugin: QueryClientPlugin = (features) => {
  features.infiniteQueryBehavior = infiniteQueryBehavior
}
