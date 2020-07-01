import { noop, stableStringify, identity, deepEqual } from './utils'

export const DEFAULT_CONFIG = {
  shared: {
    suspense: false,
  },
  queries: {
    queryKeySerializerFn: defaultQueryKeySerializerFn,
    queryFn: undefined,
    initialStale: undefined,
    enabled: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    queryFnParamsFilter: identity,
    refetchOnMount: true,
    isDataEqual: deepEqual,
    onError: noop,
    onSuccess: noop,
    onSettled: noop,
    useErrorBoundary: false,
  },
  mutations: {
    throwOnError: false,
    onMutate: noop,
    onError: noop,
    onSuccess: noop,
    onSettled: noop,
    useErrorBoundary: false,
  },
}

export const defaultConfigRef = {
  current: DEFAULT_CONFIG,
}

export function defaultQueryKeySerializerFn(queryKey) {
  if (!queryKey) {
    return []
  }

  if (!Array.isArray(queryKey)) {
    queryKey = [queryKey]
  }

  if (queryKey.some(d => typeof d === 'function')) {
    throw new Error('A valid query key is required!')
  }

  const queryHash = stableStringify(queryKey)
  queryKey = JSON.parse(queryHash)

  if (!queryHash) {
    return []
  }

  return [queryHash, queryKey]
}
