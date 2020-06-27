export const statusIdle = 'idle'
export const statusLoading = 'loading'
export const statusError = 'error'
export const statusSuccess = 'success'

let _uid = 0
export const uid = () => _uid++
export const cancelledError = {}
export let globalStateListeners = []
export const isServer = typeof window === 'undefined'
export function noop() {
  return void 0
}
export function identity(d) {
  return d
}
export let Console = console || { error: noop, warn: noop, log: noop }

export function setConsole(c) {
  Console = c
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
    const { queryKey, queryFn, config } = args[0]
    args = [queryKey, queryFn, config, ...args.slice(1)]
  } else if (isObject(args[1])) {
    const [queryKey, config, ...rest] = args
    args = [queryKey, undefined, config, ...rest]
  }

  let [queryKey, queryFn, config = {}, ...rest] = args

  queryFn = queryFn || config.queryFn

  return [queryKey, queryFn ? { ...config, queryFn } : config, ...rest]
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

export function getStatusBools(status) {
  return {
    isLoading: status === statusLoading,
    isSuccess: status === statusSuccess,
    isError: status === statusError,
    isIdle: status === statusIdle,
  }
}
