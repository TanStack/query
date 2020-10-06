import type { Query } from './query'
import type {
  QueryFunction,
  QueryKey,
  QueryKeyHashFunction,
  QueryOptions,
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
  /**
   * Include or exclude fetching queries
   */
  fetching?: boolean
}

export type DataUpdateFunction<TInput, TOutput> = (input: TInput) => TOutput

export type Updater<TInput, TOutput> =
  | TOutput
  | DataUpdateFunction<TInput, TOutput>

interface Cancelable {
  cancel(): void
}

export interface CancelOptions {
  revert?: boolean
  silent?: boolean
}

export class CancelledError {
  revert?: boolean
  silent?: boolean
  constructor(options?: CancelOptions) {
    this.revert = options?.revert
    this.silent = options?.silent
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

export function defaultRetryDelay(attempt: number) {
  return Math.min(1000 * 2 ** attempt, 30000)
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

export function timeUntilStale(updatedAt: number, staleTime?: number): number {
  return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0)
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
  const {
    active,
    exact,
    fetching,
    fresh,
    inactive,
    predicate,
    queryKey,
    stale,
  } = filters

  if (isQueryKey(queryKey)) {
    if (exact) {
      const hashFn = getQueryKeyHashFn(query.options)
      if (query.queryHash !== hashFn(queryKey)) {
        return false
      }
    } else if (
      !partialDeepEqual(ensureArray(query.queryKey), ensureArray(queryKey))
    ) {
      return false
    }
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

  if (typeof fetching === 'boolean' && query.isFetching() !== fetching) {
    return false
  }

  if (predicate && !predicate(query)) {
    return false
  }

  return true
}

export function getQueryKeyHashFn(
  options?: QueryOptions<any, any>
): QueryKeyHashFunction {
  return options?.queryKeyHashFn || hashQueryKey
}

/**
 * Default query keys hash function.
 */
export function hashQueryKey(queryKey: QueryKey): string {
  return stableValueHash(queryKey)
}

/**
 * Hashes the value into a stable hash.
 */
export function stableValueHash(value: any): string {
  return JSON.stringify(value, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce((result, key) => {
            result[key] = val[key]
            return result
          }, {} as any)
      : val
  )
}

/**
 * Checks if `b` partially matches with `a`.
 */
export function partialDeepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a === 'object') {
    return !Object.keys(b).some(key => !partialDeepEqual(a[key], b[key]))
  }

  return false
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

/**
 * Shallow compare objects. Only works with objects that always have the same properties.
 */
export function shallowEqualObjects<T>(a: T, b: T): boolean {
  for (const key in a) {
    if (a[key] !== b[key]) {
      return false
    }
  }
  return true
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
