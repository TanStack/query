import type { DefaultOptions } from './types'
import { defaultQueryKeySerializerFn } from './utils'

// CONFIG

export const DEFAULT_OPTIONS = {
  queries: {
    cacheTime: 5 * 60 * 1000,
    enabled: true,
    notifyOnStatusChange: true,
    queryKeySerializerFn: defaultQueryKeySerializerFn,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 0,
    structuralSharing: true,
  },
}

export function getDefaultOptions(): DefaultOptions {
  return DEFAULT_OPTIONS
}

export function mergeDefaultOptions(
  a: DefaultOptions,
  b?: DefaultOptions
): DefaultOptions {
  return b
    ? {
        queries: {
          ...a.queries,
          ...b.queries,
        },
        mutations: {
          ...a.mutations,
          ...b.mutations,
        },
      }
    : a
}
