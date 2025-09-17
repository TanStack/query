import { timeoutManager } from './timeoutManager'
import type { Mutation } from './mutation'
import type { FetchOptions, Query } from './query'
import type {
  DefaultError,
  FetchStatus,
  MutationKey,
  MutationStatus,
  QueryFunction,
  QueryKey,
  QueryOptions,
} from './types'

// TYPES

export interface QueryFilters<TQueryKey extends QueryKey = QueryKey> {
  /**
   * Filter to active queries, inactive queries or all queries
   */
  type?: QueryTypeFilter
  /**
   * Match query key exactly
   */
  exact?: boolean
  /**
   * Include queries matching this predicate function
   */
  predicate?: (query: Query) => boolean
  /**
   * Include queries matching this query key
   */
  queryKey?: TQueryKey
  /**
   * Include or exclude stale queries
   */
  stale?: boolean
  /**
   * Include queries matching their fetchStatus
   */
  fetchStatus?: FetchStatus
}

export interface MutationFilters<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> {
  /**
   * Match mutation key exactly
   */
  exact?: boolean
  /**
   * Include mutations matching this predicate function
   */
  predicate?: (
    mutation: Mutation<TData, TError, TVariables, TOnMutateResult>,
  ) => boolean
  /**
   * Include mutations matching this mutation key
   */
  mutationKey?: MutationKey
  /**
   * Filter by mutation status
   */
  status?: MutationStatus
}

/**
 * Utility type that excludes function types from T.
 * If T is a function, it resolves to `never`, effectively removing T
 * from unions and preventing ambiguity in value-or-function patterns.
 */
export type NonFunction<T> = T extends (...args: Array<any>) => any ? never : T

export type Updater<TInput, TOutput> = NonFunction<TOutput> | ((input: TInput) => TOutput)

export type QueryTypeFilter = 'all' | 'active' | 'inactive'

// UTILS

export const isServer = typeof window === 'undefined' || 'Deno' in globalThis

export function noop(): void
export function noop(): undefined
export function noop() {}


/**
 * Resolves a value that can either be a direct value or a function that computes the value.
 *
 * This utility eliminates the need for repetitive `typeof value === 'function'` checks
 * throughout the codebase and provides a clean way to handle the common pattern where
 * options can be static values or dynamic functions.
 *
 * @template T - The type of the resolved value (constrained to non-function types)
 * @template TArgs - Array of argument types when resolving function variants
 * @param value - Either a direct value of type T or a function that returns T
 * @param args - Arguments to pass to the function if value is a function
 * @returns The resolved value of type T
 *
 * @example
 * ```ts
 * // Zero-argument function resolution (like initialData)
 * const initialData: string | (() => string) = 'hello'
 * const resolved = resolveOption(initialData) // 'hello'
 *
 * const initialDataFn: string | (() => string) = () => 'world'
 * const resolved2 = resolveOption(initialDataFn) // 'world'
 * ```
 *
 * @example
 * ```ts
 * // Function with arguments (like staleTime, retryDelay)
 * const staleTime: number | ((query: Query) => number) = (query) => query.state.dataUpdatedAt + 5000
 * const resolved = resolveOption(staleTime, query) // number
 *
 * const retryDelay: number | ((failureCount: number, error: Error) => number) = 1000
 * const resolved2 = resolveOption(retryDelay, 3, new Error()) // 1000
 * ```
 *
 * @example
 * ```ts
 * // Replaces verbose patterns like:
 * // const delay = typeof retryDelay === 'function'
 * //   ? retryDelay(failureCount, error)
 * //   : retryDelay
 *
 * // With:
 * const delay = resolveOption(retryDelay, failureCount, error)
 * ```
 */
export function resolveOption<T, TArgs extends Array<any>>(
  valueOrFn: NonFunction<T> | ((...args: TArgs) => T) | undefined,
  ...args: TArgs
): T | undefined
// Overload for when value is guaranteed to be present
export function resolveOption<T, TArgs extends Array<any>>(
  valueOrFn: NonFunction<T> | ((...args: TArgs) => T),
  ...args: TArgs
): T
// Implementation
export function resolveOption<T, TArgs extends Array<any>>(
  valueOrFn: NonFunction<T> | ((...args: TArgs) => T) | undefined,
  ...args: TArgs
): T | undefined {
  if (typeof valueOrFn === 'function') {
    // Because of our NonFunction<T> utility, TypeScript now correctly
    // infers that if valueOrFn is a function, it must be the producer `(...args: TArgs) => T`.
    return (valueOrFn as (...args: TArgs) => T)(...args)
  }
  // If it's not a function, it must be of type T or undefined.
  return valueOrFn as T | undefined
}


export function isValidTimeout(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value !== Infinity
}

export function timeUntilStale(updatedAt: number, staleTime?: number): number {
  return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0)
}

export function matchQuery(
  filters: QueryFilters,
  query: Query<any, any, any, any>,
): boolean {
  const {
    type = 'all',
    exact,
    fetchStatus,
    predicate,
    queryKey,
    stale,
  } = filters

  if (queryKey) {
    if (exact) {
      if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) {
        return false
      }
    } else if (!partialMatchKey(query.queryKey, queryKey)) {
      return false
    }
  }

  if (type !== 'all') {
    const isActive = query.isActive()
    if (type === 'active' && !isActive) {
      return false
    }
    if (type === 'inactive' && isActive) {
      return false
    }
  }

  if (typeof stale === 'boolean' && query.isStale() !== stale) {
    return false
  }

  if (fetchStatus && fetchStatus !== query.state.fetchStatus) {
    return false
  }

  if (predicate && !predicate(query)) {
    return false
  }

  return true
}

export function matchMutation(
  filters: MutationFilters,
  mutation: Mutation<any, any>,
): boolean {
  const { exact, status, predicate, mutationKey } = filters
  if (mutationKey) {
    if (!mutation.options.mutationKey) {
      return false
    }
    if (exact) {
      if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) {
        return false
      }
    } else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) {
      return false
    }
  }

  if (status && mutation.state.status !== status) {
    return false
  }

  if (predicate && !predicate(mutation)) {
    return false
  }

  return true
}

export function hashQueryKeyByOptions<TQueryKey extends QueryKey = QueryKey>(
  queryKey: TQueryKey,
  options?: Pick<QueryOptions<any, any, any, any>, 'queryKeyHashFn'>,
): string {
  const hashFn = options?.queryKeyHashFn || hashKey
  return hashFn(queryKey)
}

/**
 * Default query & mutation keys hash function.
 * Hashes the value into a stable hash.
 */
export function hashKey(queryKey: QueryKey | MutationKey): string {
  return JSON.stringify(queryKey, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce((result, key) => {
            result[key] = val[key]
            return result
          }, {} as any)
      : val,
  )
}

/**
 * Checks if key `b` partially matches with key `a`.
 */
export function partialMatchKey(a: QueryKey, b: QueryKey): boolean
export function partialMatchKey(a: any, b: any): boolean {
  if (a === b) {
    return true
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    return Object.keys(b).every((key) => partialMatchKey(a[key], b[key]))
  }

  return false
}

const hasOwn = Object.prototype.hasOwnProperty

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

  const array = isPlainArray(a) && isPlainArray(b)

  if (!array && !(isPlainObject(a) && isPlainObject(b))) return b

  const aItems = array ? a : Object.keys(a)
  const aSize = aItems.length
  const bItems = array ? b : Object.keys(b)
  const bSize = bItems.length
  const copy: any = array ? new Array(bSize) : {}

  let equalItems = 0

  for (let i = 0; i < bSize; i++) {
    const key: any = array ? i : bItems[i]
    const aItem = a[key]
    const bItem = b[key]

    if (aItem === bItem) {
      copy[key] = aItem
      if (array ? i < aSize : hasOwn.call(a, key)) equalItems++
      continue
    }

    if (
      aItem === null ||
      bItem === null ||
      typeof aItem !== 'object' ||
      typeof bItem !== 'object'
    ) {
      copy[key] = bItem
      continue
    }

    const v = replaceEqualDeep(aItem, bItem)
    copy[key] = v
    if (v === aItem) equalItems++
  }

  return aSize === bSize && equalItems === aSize ? a : copy
}

/**
 * Shallow compare objects.
 */
export function shallowEqualObjects<T extends Record<string, any>>(
  a: T,
  b: T | undefined,
): boolean {
  if (!b || Object.keys(a).length !== Object.keys(b).length) {
    return false
  }

  for (const key in a) {
    if (a[key] !== b[key]) {
      return false
    }
  }

  return true
}

export function isPlainArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value) && value.length === Object.keys(value).length
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o: any): o is Record<PropertyKey, unknown> {
  if (!hasObjectPrototype(o)) {
    return false
  }

  // If has no constructor
  const ctor = o.constructor
  if (ctor === undefined) {
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

  // Handles Objects created by Object.create(<arbitrary prototype>)
  if (Object.getPrototypeOf(o) !== Object.prototype) {
    return false
  }

  // Most likely a plain Object
  return true
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    timeoutManager.setTimeout(resolve, timeout)
  })
}

export function replaceData<
  TData,
  TOptions extends QueryOptions<any, any, any, any>,
>(prevData: TData | undefined, data: TData, options: TOptions): TData {
  if (typeof options.structuralSharing === 'function') {
    return options.structuralSharing(prevData, data) as TData
  } else if (options.structuralSharing !== false) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        return replaceEqualDeep(prevData, data)
      } catch (error) {
        console.error(
          `Structural sharing requires data to be JSON serializable. To fix this, turn off structuralSharing or return JSON-serializable data from your queryFn. [${options.queryHash}]: ${error}`,
        )

        // Prevent the replaceEqualDeep from being called again down below.
        throw error
      }
    }
    // Structurally share data between prev and new data if needed
    return replaceEqualDeep(prevData, data)
  }
  return data
}

export function keepPreviousData<T>(
  previousData: T | undefined,
): T | undefined {
  return previousData
}

export function addToEnd<T>(items: Array<T>, item: T, max = 0): Array<T> {
  const newItems = [...items, item]
  return max && newItems.length > max ? newItems.slice(1) : newItems
}

export function addToStart<T>(items: Array<T>, item: T, max = 0): Array<T> {
  const newItems = [item, ...items]
  return max && newItems.length > max ? newItems.slice(0, -1) : newItems
}

export const skipToken = Symbol()
export type SkipToken = typeof skipToken

export function ensureQueryFn<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: {
    queryFn?: QueryFunction<TQueryFnData, TQueryKey> | SkipToken
    queryHash?: string
  },
  fetchOptions?: FetchOptions<TQueryFnData>,
): QueryFunction<TQueryFnData, TQueryKey> {
  if (process.env.NODE_ENV !== 'production') {
    if (options.queryFn === skipToken) {
      console.error(
        `Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${options.queryHash}'`,
      )
    }
  }

  // if we attempt to retry a fetch that was triggered from an initialPromise
  // when we don't have a queryFn yet, we can't retry, so we just return the already rejected initialPromise
  // if an observer has already mounted, we will be able to retry with that queryFn
  if (!options.queryFn && fetchOptions?.initialPromise) {
    return () => fetchOptions.initialPromise!
  }

  if (!options.queryFn || options.queryFn === skipToken) {
    return () =>
      Promise.reject(new Error(`Missing queryFn: '${options.queryHash}'`))
  }

  return options.queryFn
}

export function shouldThrowError<T extends (...args: Array<any>) => boolean>(
  throwOnError: boolean | T | undefined,
  params: Parameters<T>,
): boolean {
  // Allow throwOnError function to override throwing behavior on a per-error basis
  if (typeof throwOnError === 'function') {
    return throwOnError(...params)
  }

  return !!throwOnError
}
