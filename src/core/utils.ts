import type { Query } from './query'
import type {
  QueryOptions,
  QueryFunction,
  QueryKey,
  QueryStatus,
} from './types'

// TYPES

export interface QueryFilters {
  /**
   * Include or exclude active queries
   */
  active?: boolean
  /**
   * Match query key exactly
   */
  exact?: boolean
  /**
   * Include or exclude fresh queries
   */
  fresh?: boolean
  /**
   * Include or exclude inactive queries
   */
  inactive?: boolean
  /**
   * Include queries matching this predicate function
   */
  predicate?: (query: Query) => boolean
  /**
   * Include queries matching this query key
   */
  queryKey?: QueryKey
  /**
   * Include or exclude stale queries
   */
  stale?: boolean
}

export type DataUpdateFunction<TInput, TOutput> = (input: TInput) => TOutput

export type Updater<TInput, TOutput> =
  | TOutput
  | DataUpdateFunction<TInput, TOutput>

interface Cancelable {
  cancel(): void
}

export class CancelledError {
  silent?: boolean
  constructor(silent?: boolean) {
    this.silent = silent
  }
}

// UTILS

export const isServer = typeof window === 'undefined'

export function noop(): undefined {
  return undefined
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
    throw new Error()
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = value[key]
        return result
      }, {} as any)
  }

  return value
}

function stableStringify(value: any): string {
  return JSON.stringify(value, stableStringifyReplacer)
}

export function defaultQueryKeySerializerFn(queryKey: QueryKey): string {
  try {
    return stableStringify(queryKey)
  } catch {
    throw new Error('Failed to serialize query key')
  }
}

export function hashQueryKey(
  queryKey: QueryKey,
  options?: QueryOptions<any, any>
): string {
  return options?.queryKeySerializerFn
    ? options.queryKeySerializerFn(queryKey)
    : defaultQueryKeySerializerFn(queryKey)
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

export function isValidTimeout(value: any): value is number {
  return typeof value === 'number' && value >= 0 && value !== Infinity
}

export function isDocumentVisible(): boolean {
  // document global can be unavailable in react native
  if (typeof document === 'undefined') {
    return true
  }
  return [undefined, 'visible', 'prerender'].includes(document.visibilityState)
}

export function isOnline(): boolean {
  return navigator.onLine === undefined || navigator.onLine
}

export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function uniq<T>(array: T[]): T[] {
  return array.filter((value, i) => array.indexOf(value) === i)
}

export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(x => array2.indexOf(x) === -1)
}

export function replaceAt<T>(array: T[], index: number, value: T): T[] {
  const copy = array.slice(0)
  copy[index] = value
  return copy
}

export function timeUntilStale(updatedAt: number, staleTime: number): number {
  return Math.max(updatedAt + staleTime - Date.now(), 0)
}

export function parseQueryArgs<TOptions extends QueryOptions<any, any>>(
  arg1: QueryKey | TOptions,
  arg2?: QueryFunction<any> | TOptions,
  arg3?: TOptions
): TOptions {
  if (!isQueryKey(arg1)) {
    return arg1 as TOptions
  }

  if (typeof arg2 === 'function') {
    return { ...arg3, queryKey: arg1, queryFn: arg2 } as TOptions
  }

  return { ...arg2, queryKey: arg1 } as TOptions
}

export function parseFilterArgs<
  TFilters extends QueryFilters,
  TOptions = unknown
>(
  arg1?: QueryKey | TFilters,
  arg2?: TFilters | TOptions,
  arg3?: TOptions
): [TFilters, TOptions | undefined] {
  return (isQueryKey(arg1)
    ? [{ ...arg2, queryKey: arg1 }, arg3]
    : [arg1 || {}, arg2]) as [TFilters, TOptions]
}

export function matchQuery(
  filters: QueryFilters,
  query: Query<any, any>
): boolean {
  const { active, exact, fresh, inactive, predicate, queryKey, stale } = filters

  if (
    queryKey &&
    (exact
      ? query.queryHash !== hashQueryKey(queryKey, query.options)
      : !deepIncludes(query.queryKey, queryKey))
  ) {
    return false
  }

  let isActive

  if (inactive === false || (active && !inactive)) {
    isActive = true
  } else if (active === false || (inactive && !active)) {
    isActive = false
  }

  if (typeof isActive === 'boolean' && query.isActive() !== isActive) {
    return false
  }

  let isStale

  if (fresh === false || (stale && !fresh)) {
    isStale = true
  } else if (stale === false || (fresh && !stale)) {
    isStale = false
  }

  if (typeof isStale === 'boolean' && query.isStale() !== isStale) {
    return false
  }

  if (predicate && !predicate(query)) {
    return false
  }

  return true
}

/**
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 */
export function replaceEqualDeep<T>(a: unknown, b: T): T
export function replaceEqualDeep(a: any, b: any): any {
  if (a === b) {
    return a
  }

  const array = Array.isArray(a) && Array.isArray(b)

  if (array || (isPlainObject(a) && isPlainObject(b))) {
    const aSize = array ? a.length : Object.keys(a).length
    const bItems = array ? b : Object.keys(b)
    const bSize = bItems.length
    const copy: any = array ? [] : {}

    let equalItems = 0

    for (let i = 0; i < bSize; i++) {
      const key = array ? i : bItems[i]
      copy[key] = replaceEqualDeep(a[key], b[key])
      if (copy[key] === a[key]) {
        equalItems++
      }
    }

    return aSize === bSize && equalItems === aSize ? a : copy
  }

  return b
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o: any): o is Object {
  if (!hasObjectPrototype(o)) {
    return false
  }

  // If has modified constructor
  const ctor = o.constructor
  if (typeof ctor === 'undefined') {
    return true
  }

  // If has modified prototype
  const prot = ctor.prototype
  if (!hasObjectPrototype(prot)) {
    return false
  }

  // If constructor does not have an Object-specific method
  if (!prot.hasOwnProperty('isPrototypeOf')) {
    return false
  }

  // Most likely a plain Object
  return true
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

export function isQueryKey(value: any): value is QueryKey {
  return typeof value === 'string' || Array.isArray(value)
}

export function isCancelable(value: any): value is Cancelable {
  return typeof value?.cancel === 'function'
}

export function isError(value: any): value is Error {
  return value instanceof Error
}

export function isCancelledError(value: any): value is CancelledError {
  return value instanceof CancelledError
}

export function sleep(timeout: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

export function getStatusProps<T extends QueryStatus>(status: T) {
  return {
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
  }
}

export function createSetHandler(fn: () => void) {
  let removePreviousHandler: (() => void) | void
  return (callback: (handler: () => void) => void) => {
    // Unsub the old handler
    if (removePreviousHandler) {
      removePreviousHandler()
    }
    // Sub the new handler
    removePreviousHandler = callback(fn)
  }
}

/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
export function scheduleMicrotask(callback: () => void): void {
  Promise.resolve()
    .then(callback)
    .catch(error =>
      setTimeout(() => {
        throw error
      })
    )
}
