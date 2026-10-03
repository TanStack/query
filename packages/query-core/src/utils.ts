import { timeoutManager } from './timeoutManager'
import type {
  DefaultError,
  FetchStatus,
  MutationKey,
  MutationStatus,
  QueryFunction,
  QueryKey,
  QueryOptions,
} from './types'
import type { Mutation } from './mutation'
import type { FetchOptions, Query } from './query'

// TYPES

type DropLast<T extends ReadonlyArray<unknown>> = T extends readonly [
  ...infer R,
  unknown,
]
  ? readonly [...R]
  : never

type TuplePrefixes<T extends ReadonlyArray<unknown>> = T extends readonly []
  ? readonly []
  : TuplePrefixes<DropLast<T>> | T

/**
 * Filters used to select queries, for example in `queryClient.getQueriesData` or `queryClient.invalidateQueries`.
 * All provided filters must match; filters that are left unspecified are ignored.
 */
export interface QueryFilters<TQueryKey extends QueryKey = QueryKey> {
  /**
   * Filter to active queries, inactive queries or all queries
   * @defaultValue 'all'
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
  queryKey?: TQueryKey | TuplePrefixes<TQueryKey>
  /**
   * Include or exclude stale queries
   */
  stale?: boolean
  /**
   * Include queries matching their fetchStatus
   */
  fetchStatus?: FetchStatus
}

/**
 * Filters used to select mutations, for example in `mutationCache.findAll` or `queryClient.isMutating`.
 * All provided filters must match; filters that are left unspecified are ignored.
 */
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
  mutationKey?: TuplePrefixes<MutationKey>
  /**
   * Filter by mutation status
   */
  status?: MutationStatus
}

/**
 * Either a plain value of type `TOutput`, or a function that receives `TInput` and returns `TOutput`.
 * Used for example by `setQueryData`-style updaters, which accept either the new data directly or a
 * function that computes it from the previous data. See {@link functionalUpdate}.
 * @example
 * ```ts
 * queryClient.setQueryData(['posts'], newPosts)
 *
 * // Or, using an updater function that receives the current data:
 * queryClient.setQueryData(['posts'], (oldPosts) =>
 *   oldPosts ? [...oldPosts, newPost] : oldPosts,
 * )
 * ```
 */
export type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput)

export type QueryTypeFilter = 'all' | 'active' | 'inactive'

// UTILS

/**
 * @deprecated use `environmentManager.isServer()` instead.
 */
export const isServer = typeof window === 'undefined' || 'Deno' in globalThis

/**
 * A function that does nothing.
 */
export function noop(): void
export function noop(): undefined
export function noop() {}

/**
 * Resolves an {@link Updater}: calls it with `input` if it is a function, otherwise returns it as
 * is.
 * @param updater - The new value, or a function that receives `input` and returns the new value.
 * @param input - The current value, passed to `updater` if it is a function.
 * @returns The new value.
 */
export function functionalUpdate<TInput, TOutput>(
  updater: Updater<TInput, TOutput>,
  input: TInput,
): TOutput {
  return typeof updater === 'function'
    ? (updater as (_: TInput) => TOutput)(input)
    : updater
}

/**
 * Checks whether a value can be used as a timeout: a non-negative, finite number.
 * @param value - The value to check.
 * @returns `true` if `value` is a number that is `>= 0` and not `Infinity`.
 */
export function isValidTimeout(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value !== Infinity
}

/**
 * Calculates how long until data updated at `updatedAt` becomes stale.
 * @param updatedAt - The timestamp, in milliseconds, at which the data was last updated.
 * @param staleTime - The time, in milliseconds, after which data is considered stale. Defaults to
 * `0`.
 * @returns The remaining time in milliseconds, or `0` if the data is already stale.
 */
export function timeUntilStale(updatedAt: number, staleTime?: number): number {
  return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0)
}

/**
 * Resolves an option that can be given either as a value or as a function of the query, such as
 * `staleTime`.
 * @param value - The option value, or a function that receives `query` and returns the value.
 * @param query - The query passed to `value` if it is a function.
 * @returns The resolved value, or `undefined` if `value` is `undefined`.
 */
export function resolveQueryValue<
  TValue,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  value:
    | undefined
    | TValue
    | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => TValue),
  query: Query<TQueryFnData, TError, TData, TQueryKey>,
): TValue | undefined {
  return typeof value === 'function'
    ? (
        value as (
          query: Query<TQueryFnData, TError, TData, TQueryKey>,
        ) => TValue
      )(query)
    : value
}

/**
 * Checks whether a query matches the given {@link QueryFilters}.
 * Every filter that is specified must match; filters that are left unspecified are ignored.
 * @param filters - The filters to check the query against.
 * @param query - The query to check.
 * @returns `true` if the query matches every specified filter.
 * @example
 * ```ts
 * const queryCache = queryClient.getQueryCache()
 *
 * const matchingQueries = queryCache
 *   .getAll()
 *   .filter((query) => matchQuery({ queryKey: ['posts'] }, query))
 * ```
 */
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

/**
 * Checks whether a mutation matches the given {@link MutationFilters}.
 * Every filter that is specified must match; filters that are left unspecified are ignored.
 * If a `mutationKey` filter is provided but the mutation has no `mutationKey` of its own, it does not match.
 * @param filters - The filters to check the mutation against.
 * @param mutation - The mutation to check.
 * @returns `true` if the mutation matches every specified filter.
 * @example
 * ```ts
 * const mutationCache = queryClient.getMutationCache()
 *
 * const matchingMutations = mutationCache
 *   .getAll()
 *   .filter((mutation) => matchMutation({ mutationKey: ['addPost'] }, mutation))
 * ```
 */
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

/**
 * Hashes a query key with the query's `queryKeyHashFn` option, falling back to {@link hashKey}.
 * @param queryKey - The query key to hash.
 * @param options - The query options that may provide a custom `queryKeyHashFn`.
 * @returns The hash of the query key.
 */
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
 * @param queryKey - The query or mutation key to hash.
 * @returns The stable hash of the key, as a JSON string.
 * @example
 * ```ts
 * // Object keys are sorted, so key order doesn't affect the hash:
 * hashKey(['todos', { page: 1, filter: 'done' }]) // === '["todos",{"filter":"done","page":1}]'
 * ```
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
 * @param a - The key to check, e.g. a query's own key.
 * @param b - The (partial) key to match against `a`.
 * @returns `true` if every array element or object property in `b` matches the one at the same
 * position in `a`.
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
    if (Array.isArray(a) && Array.isArray(b)) {
      if (b.length > a.length) return false
      for (let i = 0; i < b.length; i++) {
        if (!partialMatchKey(a[i], b[i])) {
          return false
        }
      }
      return true
    }

    const bKeys = Object.keys(b)
    for (const key of bKeys) {
      if (!partialMatchKey(a[key], b[key])) {
        return false
      }
    }
    return true
  }

  return false
}

const hasOwn = Object.prototype.hasOwnProperty

/**
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 * @param a - The previous value, whose deeply equal parts are reused.
 * @param b - The new value.
 * @param depth - The current recursion depth. Past a depth of `500`, `b` is returned as is.
 * @returns `a` if `b` is deeply equal to it, otherwise `b` with its deeply equal parts replaced by
 * those of `a`.
 */
export function replaceEqualDeep<T>(a: unknown, b: T, depth?: number): T
export function replaceEqualDeep(a: any, b: any, depth = 0): any {
  if (a === b) {
    return a
  }

  if (depth > 500) return b

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

    const v = replaceEqualDeep(aItem, bItem, depth + 1)
    copy[key] = v
    if (v === aItem) equalItems++
  }

  return aSize === bSize && equalItems === aSize ? a : copy
}

/**
 * Shallow compare objects.
 * @param a - The first object.
 * @param b - The second object, or `undefined`.
 * @returns `true` if both objects have the same keys, with strictly equal values for each key.
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

/**
 * Checks whether a value is an array with no holes and no extra properties.
 * @param value - The value to check.
 * @returns `true` if `value` is an array whose number of own keys equals its `length`.
 */
export function isPlainArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value) && value.length === Object.keys(value).length
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
/**
 * Checks whether a value is a plain object, e.g. created with an object literal or
 * `Object.create(null)`.
 * @param o - The value to check.
 * @returns `true` if `o` is a plain object.
 */
export function isPlainObject(o: any): o is Record<PropertyKey, unknown> {
  if (!hasObjectPrototype(o)) {
    return false
  }

  // If has no constructor
  const objectPrototype = Object.getPrototypeOf(o)
  const ctor = objectPrototype?.constructor
  if (ctor === undefined) {
    return true
  }

  if (typeof ctor !== 'function') {
    return false
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
  if (objectPrototype !== Object.prototype) {
    return false
  }

  // Most likely a plain Object
  return true
}

/**
 * Checks whether a value's `Object.prototype.toString` tag is `[object Object]`.
 * @param o - The value to check.
 * @returns `true` if the tag is `[object Object]`.
 */
function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

/**
 * Waits for the given time, using the configured {@link timeoutManager}.
 * @param timeout - The time to wait, in milliseconds.
 * @returns A promise that resolves after `timeout` milliseconds.
 */
export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    timeoutManager.setTimeout(resolve, timeout)
  })
}

/**
 * Applies a query's `structuralSharing` option when writing new data.
 * @param prevData - The previously cached data.
 * @param data - The new data.
 * @param options - The query options, whose `structuralSharing` decides how the data is merged.
 * @returns The result of a custom `structuralSharing` function, `data` with its unchanged parts
 * replaced by those of `prevData` by default, or `data` as is if `structuralSharing` is `false`.
 * @throws {Error} The error from the default structural sharing, e.g. when the data is not JSON serializable.
 * Outside production, it is also logged to the console.
 */
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

/**
 * Intended to be passed as a query's `placeholderData` option, for example
 * `placeholderData: keepPreviousData`. Instead of resetting the query's data to `undefined` while a new
 * query key is fetching, it keeps displaying the previously fetched data until the new data arrives.
 * @param previousData - The data of the previous query key, passed by the observer.
 * @returns The previous data, unchanged.
 * @example
 * ```ts
 * new QueryObserver(queryClient, {
 *   queryKey: ['posts', page],
 *   queryFn: () => fetchPosts(page),
 *   placeholderData: keepPreviousData,
 * })
 * ```
 */
export function keepPreviousData<T>(
  previousData: T | undefined,
): T | undefined {
  return previousData
}

/**
 * Returns a new array with `item` added at the end. If that makes the array longer than `max`,
 * the first item is dropped. Only one item is dropped, so the result can still exceed `max` if
 * `items` already did.
 * @param items - The current items.
 * @param item - The item to add.
 * @param max - The length above which an item is dropped. `0` (the default) means no limit.
 * @returns A new array with `item` added.
 */
export function addToEnd<T>(items: Array<T>, item: T, max = 0): Array<T> {
  const newItems = [...items, item]
  return max && newItems.length > max ? newItems.slice(1) : newItems
}

/**
 * Returns a new array with `item` added at the start. If that makes the array longer than `max`,
 * the last item is dropped. Only one item is dropped, so the result can still exceed `max` if
 * `items` already did.
 * @param items - The current items.
 * @param item - The item to add.
 * @param max - The length above which an item is dropped. `0` (the default) means no limit.
 * @returns A new array with `item` added.
 */
export function addToStart<T>(items: Array<T>, item: T, max = 0): Array<T> {
  const newItems = [item, ...items]
  return max && newItems.length > max ? newItems.slice(0, -1) : newItems
}

/**
 * Sentinel value that can be passed as a query's `queryFn` to conditionally disable the query (equivalent
 * to `enabled: false`) while preserving full type inference for the query's data. Unlike `enabled: false`,
 * a query disabled via `skipToken` cannot be triggered with `refetch`.
 * @example
 * ```ts
 * new QueryObserver(queryClient, {
 *   queryKey: ['post', postId],
 *   queryFn: postId != null ? () => fetchPost(postId) : skipToken,
 * })
 * ```
 */
export const skipToken = Symbol()
/**
 * The type of the {@link skipToken} sentinel value.
 */
export type SkipToken = typeof skipToken

/**
 * Returns the function to call for a fetch. If there is no `queryFn` but the fetch was started from
 * an `initialPromise`, that promise is returned instead. If there is no usable `queryFn` (missing or
 * {@link skipToken}), the returned function rejects with a `Missing queryFn` error.
 * @param options - The query options with the `queryFn`, and the `queryHash` used in error messages.
 * @param fetchOptions - The fetch options, which may carry an `initialPromise`.
 * @returns The function to call for the fetch.
 */
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

/**
 * Resolves a `throwOnError` option to a boolean.
 * If `throwOnError` is a function, it is called with `params` (e.g. the error and, depending on the caller,
 * additional context such as the query or mutation) and its result is returned, allowing the throwing
 * behavior to be decided per error. Otherwise, `throwOnError` itself is coerced to a boolean (`undefined`
 * resolves to `false`).
 * @param throwOnError - The `throwOnError` option: a boolean, a function that decides per error, or
 * `undefined`.
 * @param params - The arguments passed to `throwOnError` if it is a function.
 * @returns Whether the error should be thrown.
 * @example
 * ```ts
 * const throwOnError =
 *   query.state.error && typeof options.throwOnError === 'function'
 *     ? shouldThrowError(options.throwOnError, [query.state.error, query])
 *     : options.throwOnError
 * ```
 */
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

/**
 * Adds a lazy `signal` getter to an object, such as a query function context. The first time
 * `signal` is read, `onCancelled` is registered for the signal's `abort` event (or called right
 * away if it is already aborted), so cancellation is only tracked when the signal is actually used.
 * @param object - The object to add the `signal` property to.
 * @param getSignal - Returns the `AbortSignal`. Called once, when `signal` is first read.
 * @param onCancelled - Called when the signal is aborted, if `signal` was read.
 * @returns The same object, with the `signal` property added.
 */
export function addConsumeAwareSignal<T>(
  object: T,
  getSignal: () => AbortSignal,
  onCancelled: VoidFunction,
): T & { signal: AbortSignal } {
  let consumed = false
  let signal: AbortSignal | undefined

  Object.defineProperty(object, 'signal', {
    enumerable: true,
    get: () => {
      signal ??= getSignal()
      if (consumed) {
        return signal
      }

      consumed = true
      if (signal.aborted) {
        onCancelled()
      } else {
        signal.addEventListener('abort', onCancelled, { once: true })
      }

      return signal
    },
  })

  return object as T & { signal: AbortSignal }
}
