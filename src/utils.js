import React from 'react'

//

export const statusIdle = 'idle'
export const statusLoading = 'loading'
export const statusError = 'error'
export const statusSuccess = 'success'

let _uid = 0
export const uid = () => _uid++
export const cancelledError = {}
export let globalStateListeners = []
export const isServer = typeof window === 'undefined'
export const noop = () => {}
export const identity = d => d
export let Console = console || { error: noop, warn: noop, log: noop }

export function useUid() {
  const ref = React.useRef(null)

  if (ref.current === null) {
    ref.current = uid()
  }

  return ref.current
}

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
    : value
}

export function stableStringify(obj) {
  return JSON.stringify(obj, stableStringifyReplacer)
}

export function isObject(a) {
  return a && typeof a === 'object' && !Array.isArray(a)
}

export function deepIncludes(a, b) {
  if (a === b) {
    return true
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a === 'object') {
    return !Object.keys(b).some(key => !deepIncludes(a[key], b[key]))
  }

  return false
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

export function getQueryArgs(args) {
  if (isObject(args[0])) {
    if (
      args[0].hasOwnProperty('queryKey') &&
      args[0].hasOwnProperty('queryFn')
    ) {
      const { queryKey, variables = [], queryFn, config = {} } = args[0]
      return [queryKey, variables, queryFn, config]
    } else {
      throw new Error('queryKey and queryFn keys are required.')
    }
  }

  if (typeof args[2] === 'function') {
    const [queryKey, variables = [], queryFn, config = {}] = args
    return [queryKey, variables, queryFn, config]
  }

  const [queryKey, queryFn, config = {}] = args

  return [queryKey, [], queryFn, config]
}

export function useMountedCallback(callback) {
  const mounted = React.useRef(false)
  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])
  return React.useCallback(
    (...args) => (mounted.current ? callback(...args) : void 0),
    [callback]
  )
}

export function handleSuspense(queryInfo) {
  if (queryInfo.config.suspense || queryInfo.config.useErrorBoundary) {
    if (queryInfo.status === statusError) {
      setTimeout(() => {
        queryInfo.query.state.status = 'loading'
      })
      throw queryInfo.error
    }
  }

  if (queryInfo.config.suspense) {
    if (queryInfo.status === statusLoading) {
      queryInfo.query.wasSuspended = true
      throw queryInfo.refetch()
    }
  }
}

// This deep-equal is directly based on https://github.com/epoberezkin/fast-deep-equal.
// The parts for comparing any non-JSON-supported values has been removed
export function deepEqual(a, b) {
  if (a === b) return true

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var length, i, keys
    if (Array.isArray(a)) {
      length = a.length
      // eslint-disable-next-line eqeqeq
      if (length != b.length) return false
      for (i = length; i-- !== 0; ) if (!deepEqual(a[i], b[i])) return false
      return true
    }

    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf()

    keys = Object.keys(a)
    length = keys.length
    if (length !== Object.keys(b).length) return false

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false

    for (i = length; i-- !== 0; ) {
      var key = keys[i]

      if (!deepEqual(a[key], b[key])) return false
    }

    return true
  }

  // true if both NaN, false otherwise
  // eslint-disable-next-line no-self-compare
  return a !== a && b !== b
}
