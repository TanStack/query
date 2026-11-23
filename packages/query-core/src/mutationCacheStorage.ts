import type { MutationCache } from './mutationCache'
import type { QueryClient } from './queryClient'

export const mutationCaches = new WeakMap<QueryClient, MutationCache>()
