import { stableStringify, identity } from './utils'
import {
  ArrayQueryKey,
  QueryKey,
  QueryKeySerializerFunction,
  ReactQueryConfig,
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

export const DEFAULT_CONFIG: ReactQueryConfig = {
  shared: {
    suspense: false,
  },
  queries: {
    queryKeySerializerFn: defaultQueryKeySerializerFn,
    enabled: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    queryFnParamsFilter: identity,
    refetchOnMount: true,
    useErrorBoundary: false,
  },
  mutations: {
    throwOnError: false,
    useErrorBoundary: false,
  },
}

export const defaultConfigRef: ReactQueryConfigRef = {
  current: DEFAULT_CONFIG,
}
