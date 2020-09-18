import { stableStringify } from './utils'
import type {
  ArrayQueryKey,
  MutationConfig,
  QueryConfig,
  QueryKey,
  QueryKeySerializerFunction,
  ReactQueryConfig,
  ResolvedQueryConfig,
} from './types'
import type { QueryCache } from './queryCache'

// TYPES

export interface ReactQueryConfigRef {
  current: ReactQueryConfig
}

// CONFIG

export const defaultQueryKeySerializerFn: QueryKeySerializerFunction = (
  queryKey: QueryKey
): [string, ArrayQueryKey] => {
  try {
    let arrayQueryKey: ArrayQueryKey = Array.isArray(queryKey)
      ? queryKey
      : [queryKey]
    const queryHash = stableStringify(arrayQueryKey)
    arrayQueryKey = JSON.parse(queryHash)
    return [queryHash, arrayQueryKey]
  } catch {
    throw new Error('A valid query key is required!')
  }
}

/**
 * Config merging strategy
 *
 * When using hooks the config will be merged in the following order:
 *
 * 1. These defaults.
 * 2. Defaults from the hook query cache.
 * 3. Combined defaults from any config providers in the tree.
 * 4. Query/mutation config provided to the hook.
 *
 * When using a query cache directly the config will be merged in the following order:
 *
 * 1. These defaults.
 * 2. Defaults from the query cache.
 * 3. Query/mutation config provided to the query cache method.
 */
export const DEFAULT_CONFIG: ReactQueryConfig = {
  queries: {
    cacheTime: 5 * 60 * 1000,
    enabled: true,
    notifyOnStatusChange: true,
    queryFn: () => Promise.reject(),
    queryKeySerializerFn: defaultQueryKeySerializerFn,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    structuralSharing: true,
  },
}

export function getDefaultReactQueryConfig() {
  return {
    queries: { ...DEFAULT_CONFIG.queries },
    mutations: { ...DEFAULT_CONFIG.mutations },
  }
}

export function mergeReactQueryConfigs(
  a: ReactQueryConfig,
  b: ReactQueryConfig
): ReactQueryConfig {
  return {
    shared: {
      ...a.shared,
      ...b.shared,
    },
    queries: {
      ...a.queries,
      ...b.queries,
    },
    mutations: {
      ...a.mutations,
      ...b.mutations,
    },
  }
}

export function getResolvedQueryConfig<TResult, TError>(
  queryCache: QueryCache,
  queryKey: QueryKey,
  contextConfig?: ReactQueryConfig,
  config?: QueryConfig<TResult, TError>
): ResolvedQueryConfig<TResult, TError> {
  const queryCacheConfig = queryCache.getDefaultConfig()

  const resolvedConfig = {
    ...DEFAULT_CONFIG.queries,
    ...queryCacheConfig?.shared,
    ...queryCacheConfig?.queries,
    ...contextConfig?.shared,
    ...contextConfig?.queries,
    ...config,
  } as ResolvedQueryConfig<TResult, TError>

  const result = resolvedConfig.queryKeySerializerFn(queryKey)

  resolvedConfig.queryCache = queryCache
  resolvedConfig.queryHash = result[0]
  resolvedConfig.queryKey = result[1]

  return resolvedConfig
}

export function isResolvedQueryConfig<TResult, TError>(
  config: any
): config is ResolvedQueryConfig<TResult, TError> {
  return Boolean(config.queryHash)
}

export function getResolvedMutationConfig<
  TResult,
  TError,
  TVariables,
  TSnapshot
>(
  queryCache: QueryCache,
  contextConfig?: ReactQueryConfig,
  config?: MutationConfig<TResult, TError, TVariables, TSnapshot>
): MutationConfig<TResult, TError, TVariables, TSnapshot> {
  const queryCacheConfig = queryCache.getDefaultConfig()
  return {
    ...DEFAULT_CONFIG.mutations,
    ...queryCacheConfig?.shared,
    ...queryCacheConfig?.mutations,
    ...contextConfig?.shared,
    ...contextConfig?.mutations,
    ...config,
  } as MutationConfig<TResult, TError, TVariables, TSnapshot>
}
