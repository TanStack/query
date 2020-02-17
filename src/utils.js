import React from 'react'

//
export const statusIdle = 'idle'
export const statusLoading = 'loading'
export const statusError = 'error'
export const statusSuccess = 'success'

export const actionInit = {}
export const actionActivate = {}
export const actionDeactivate = {}
export const actionFailed = {}
export const actionMarkStale = {}
export const actionFetch = {}
export const actionSuccess = {}
export const actionError = {}
export const actionSetData = {}

export const defaultConfigRef = {
  current: {
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchAllOnWindowFocus: true,
    refetchInterval: false,
    suspense: false,
    queryKeySerializerFn: defaultQueryKeySerializerFn,
    throwOnError: true,
    useErrorBoundary: undefined, // this will default to the suspense value
  },
}

let _uid = 0
export const uid = () => _uid++

export let queries = []
export const cancelledError = {}
export let globalStateListeners = []
export const configContext = React.createContext()
export const isServer = typeof window === 'undefined'
export const noop = () => {}
export let Console = console || { error: noop, warn: noop, log: noop }

export function setConsole(c) {
  Console = c
}

export function useGetLatest(obj) {
  const ref = React.useRef()
  ref.current = obj

  return React.useCallback(() => ref.current, [])
}

export function functionalUpdate(updater, old) {
  return typeof updater === 'function' ? updater(old) : updater
}

export function useConfigContext() {
  return React.useContext(configContext) || defaultConfigRef.current
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

  if (Array.isArray(queryKey)) {
    let [id, variables] = queryKey
    const variablesIsObject = isObject(variables)

    if (typeof id !== 'string' || (variables && !variablesIsObject)) {
      Console.warn('Tuple queryKey:', queryKey)
      throw new Error(
        `Invalid query key tuple type: [${typeof id}, and ${typeof variables}]`
      )
    }

    const variablesHash = variablesIsObject ? stableStringify(variables) : ''

    return [
      `${id}${variablesHash ? `_${variablesHash}` : ''}`,
      id,
      variablesHash,
      variables,
    ]
  }

  return [queryKey, queryKey]
}

export function stableStringifyReplacer(_, value) {
  return isObject(value)
    ? Object.assign(
        {},
        ...Object.keys(value)
          .sort()
          .map(key => ({
            [key]: value[key],
          }))
      )
    : Array.isArray(value)
    ? value
    : String(value)
}

export function stableStringify(obj) {
  return JSON.stringify(obj, stableStringifyReplacer)
}

export function isObject(a) {
  return a && typeof a === 'object' && !Array.isArray(a)
}

export function isDocumentVisible() {
  return (
    typeof document === 'undefined' ||
    document.visibilityState === undefined ||
    document.visibilityState === 'visible' ||
    document.visibilityState === 'prerender'
  )
}

export function isOnline() {
  return navigator.onLine === undefined || navigator.onLine
}
