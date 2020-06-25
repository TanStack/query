import React from 'react'
import { noop, stableStringify, identity, deepEqual } from './utils'

export const configContext = React.createContext()

const DEFAULT_CONFIG = {
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

export function useConfigContext() {
  return React.useContext(configContext) || defaultConfigRef.current
}

export function ReactQueryConfigProvider({ config, children }) {
  let configContextValue = useConfigContext()

  const newConfig = React.useMemo(() => {
    const { shared = {}, queries = {}, mutations = {} } = config
    const {
      shared: contextShared = {},
      queries: contextQueries = {},
      mutations: contextMutations = {},
    } = configContextValue

    return {
      shared: {
        ...contextShared,
        ...shared,
      },
      queries: {
        ...contextQueries,
        ...queries,
      },
      mutations: {
        ...contextMutations,
        ...mutations,
      },
    }
  }, [config, configContextValue])

  React.useEffect(() => {
    // restore previous config on unmount
    return () => {
      defaultConfigRef.current = { ...(configContextValue || DEFAULTS) }
    }
  }, [configContextValue])

  if (!configContextValue) {
    defaultConfigRef.current = newConfig
  }

  return (
    <configContext.Provider value={newConfig}>
      {children}
    </configContext.Provider>
  )
}

function invalidQueryKey() {
  throw new Error('A valid query key is required!')
}

export function defaultQueryKeySerializerFn(queryKey) {
  if (!queryKey) {
    invalidQueryKey()
  }

  if (!Array.isArray(queryKey)) {
    queryKey = [queryKey]
  }

  if (queryKey.some(d => typeof d === 'function')) {
    invalidQueryKey()
  }

  const queryHash = stableStringify(queryKey)
  queryKey = JSON.parse(queryHash)

  if (!queryHash) {
    invalidQueryKey()
  }

  return [queryHash, queryKey]
}
