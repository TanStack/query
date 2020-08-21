import { stableStringify } from './utils'
import {
  ArrayQueryKey,
  QueryKey,
  QueryKeySerializerFunction,
  ReactQueryConfig,
  QueryConfig,
  MutationConfig,
} from './types'

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
    queryKeySerializerFn: defaultQueryKeySerializerFn,
    enabled: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    structuralSharing: true,
  },
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

export function getDefaultedQueryConfig<TResult, TError>(
  queryCacheConfig?: ReactQueryConfig,
  contextConfig?: ReactQueryConfig,
  config?: QueryConfig<TResult, TError>,
  configOverrides?: QueryConfig<TResult, TError>
): QueryConfig<TResult, TError> {
  return {
    ...DEFAULT_CONFIG.shared,
    ...DEFAULT_CONFIG.queries,
    ...queryCacheConfig?.shared,
    ...queryCacheConfig?.queries,
    ...contextConfig?.shared,
    ...contextConfig?.queries,
    ...config,
    ...configOverrides,
  } as QueryConfig<TResult, TError>
}

export function getDefaultedMutationConfig<
  TResult,
  TError,
  TVariables,
  TSnapshot
>(
  queryCacheConfig?: ReactQueryConfig,
  contextConfig?: ReactQueryConfig,
  config?: MutationConfig<TResult, TError, TVariables, TSnapshot>,
  configOverrides?: MutationConfig<TResult, TError, TVariables, TSnapshot>
): MutationConfig<TResult, TError, TVariables, TSnapshot> {
  return {
    ...DEFAULT_CONFIG.shared,
    ...DEFAULT_CONFIG.mutations,
    ...queryCacheConfig?.shared,
    ...queryCacheConfig?.mutations,
    ...contextConfig?.shared,
    ...contextConfig?.mutations,
    ...config,
    ...configOverrides,
  } as MutationConfig<TResult, TError, TVariables, TSnapshot>
}
