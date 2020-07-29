import { QueryConfig, QueryStatus, QueryKey, QueryFunction } from './types'

// TYPES

export type DataUpdateFunction<TInput, TOutput> = (input: TInput) => TOutput

export type Updater<TInput, TOutput> =
  | TOutput
  | DataUpdateFunction<TInput, TOutput>

type ConsoleFunction = (...args: any[]) => void

export interface ConsoleObject {
  log: ConsoleFunction
  warn: ConsoleFunction
  error: ConsoleFunction
}

// UTILS

let _uid = 0
export const uid = () => _uid++
export const cancelledError = {}
export const globalStateListeners = []
export const isServer = typeof window === 'undefined'
export function noop(): void {
  return void 0
}
export function identity<T>(d: T): T {
  return d
}
export let Console: ConsoleObject = console || {
  error: noop,
  warn: noop,
  log: noop,
}

export function setConsole(c: ConsoleObject) {
  Console = c
}

export function functionalUpdate<TInput, TOutput>(
  updater: Updater<TInput, TOutput>,
  input: TInput
): TOutput {
  return typeof updater === 'function'
    ? (updater as DataUpdateFunction<TInput, TOutput>)(input)
    : updater
}

function stableStringifyReplacer(_key: string, value: any): unknown {
  if (typeof value === 'function') {
    throw new Error('Cannot stringify non JSON value')
  }

  if (isObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = value[key]
        return result
      }, {} as any)
  }

  return value
}

export function stableStringify(value: any): string {
  return JSON.stringify(value, stableStringifyReplacer)
}

export function isObject(a: unknown): boolean {
  return a && typeof a === 'object' && !Array.isArray(a)
}

export function deepIncludes(a: any, b: any): boolean {
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

export function isDocumentVisible(): boolean {
  const visibilityState = document?.visibilityState as any

  return [undefined, 'visible', 'prerender'].includes(visibilityState)
}

export function isOnline(): boolean {
  return navigator.onLine === undefined || navigator.onLine
}

export function getQueryArgs<TResult, TError, TOptions = undefined>(
  args: any[]
): [QueryKey, QueryConfig<TResult, TError>, TOptions] {
  let queryKey: QueryKey
  let queryFn: QueryFunction<TResult> | undefined
  let config: QueryConfig<TResult, TError> | undefined
  let options: TOptions

  if (isObject(args[0])) {
    queryKey = args[0].queryKey
    queryFn = args[0].queryFn
    config = args[0].config
    options = args[1]
  } else if (isObject(args[1])) {
    queryKey = args[0]
    config = args[1]
    options = args[2]
  } else {
    queryKey = args[0]
    queryFn = args[1]
    config = args[2]
    options = args[3]
  }

  config = config || {}

  if (queryFn) {
    config = { ...config, queryFn }
  }

  return [queryKey, config, options]
}

export function deepEqual(a: any, b: any): boolean {
  return equal(a, b, true)
}

export function shallowEqual(a: any, b: any): boolean {
  return equal(a, b, false)
}

// This deep-equal is directly based on https://github.com/epoberezkin/fast-deep-equal.
// The parts for comparing any non-JSON-supported values has been removed
function equal(a: any, b: any, deep: boolean, depth = 0): boolean {
  if (a === b) return true

  if (
    (deep || !depth) &&
    a &&
    b &&
    typeof a == 'object' &&
    typeof b == 'object'
  ) {
    let length, i
    if (Array.isArray(a)) {
      length = a.length
      // eslint-disable-next-line eqeqeq
      if (length != b.length) return false
      for (i = length; i-- !== 0; )
        if (!equal(a[i], b[i], deep, depth + 1)) return false
      return true
    }

    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf()

    const keys = Object.keys(a)
    length = keys.length
    if (length !== Object.keys(b).length) return false

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false

    for (i = length; i-- !== 0; ) {
      const key = keys[i]

      if (!equal(a[key], b[key], deep, depth + 1)) return false
    }

    return true
  }

  // true if both NaN, false otherwise
  // eslint-disable-next-line no-self-compare
  return a !== a && b !== b
}

export function getStatusProps<T extends QueryStatus>(status: T) {
  return {
    status,
    isLoading: status === QueryStatus.Loading,
    isSuccess: status === QueryStatus.Success,
    isError: status === QueryStatus.Error,
    isIdle: status === QueryStatus.Idle,
  }
}
