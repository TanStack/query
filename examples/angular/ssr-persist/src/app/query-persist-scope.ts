/**
 * Query key prefix for data that should be written to `localStorage` by the global persister.
 * SSR queries (e.g. `['posts']`) use different keys and are excluded in `dehydrateOptions`.
 */
export const CLIENT_PERSIST_QUERY_ROOT = 'client-persist' as const
