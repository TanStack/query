import React from 'react'
import { noop, stableStringify, identity, deepEqual } from './utils'

export const configContext = React.createContext()

const DEFAULTS = {
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 0,
  cacheTime: 5 * 60 * 1000,
  refetchAllOnWindowFocus: true,
  refetchInterval: false,
  suspense: false,
  queryKeySerializerFn: defaultQueryKeySerializerFn,
  queryFnParamsFilter: identity,
  throwOnError: false,
  useErrorBoundary: undefined, // this will default to the suspense value
  onMutate: noop,
  onSuccess: noop,
  onError: noop,
  onSettled: noop,
  refetchOnMount: true,
  isDataEqual: deepEqual,
}

export const defaultConfigRef = {
  current: DEFAULTS,
}

export function useConfigContext() {
  return React.useContext(configContext) || defaultConfigRef.current
}

export function ReactQueryConfigProvider({ config, children }) {
  let configContextValue = React.useContext(configContext)

  const newConfig = React.useMemo(() => {
    const newConfig = {
      ...(configContextValue || defaultConfigRef.current),
      ...config,
    }

    // Default useErrorBoundary to the suspense value
    if (typeof newConfig.useErrorBoundary === 'undefined') {
      newConfig.useErrorBoundary = newConfig.suspense
    }

    return newConfig
  }, [config, configContextValue])

  React.useEffect(() => {
    // restore previous config on unmount
    return () => {
      defaultConfigRef.current = { ...(configContextValue || DEFAULTS) }

      // Default useErrorBoundary to the suspense value
      if (typeof defaultConfigRef.current.useErrorBoundary === 'undefined') {
        defaultConfigRef.current.useErrorBoundary =
          defaultConfigRef.current.suspense
      }
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

export function defaultQueryKeySerializerFn(queryKey) {
  if (!queryKey) {
    return []
  }

  if (typeof queryKey === 'function') {
    try {
      return defaultQueryKeySerializerFn(queryKey())
    } catch {
      return []
    }
  }

  if (typeof queryKey === 'string') {
    queryKey = [queryKey]
  }

  const queryHash = stableStringify(queryKey)
  queryKey = JSON.parse(queryHash)

  return [queryHash, queryKey]
}
