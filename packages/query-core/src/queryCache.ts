import {
  hashKey,
  hashQueryKeyByOptions,
  matchQuery,
  partialMatchKey,
} from './utils'
import { Query } from './query'
import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import type { Action, QueryState } from './query'
import type { QueryFilters } from './utils'
import type {
  DefaultError,
  NotifyEvent,
  QueryKey,
  QueryKeyHashFunction,
  QueryOptions,
  WithRequired,
} from './types'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'

// TYPES

interface QueryCacheConfig {
  onError?: (
    error: DefaultError,
    query: Query<unknown, unknown, unknown>,
  ) => void
  onSuccess?: (data: unknown, query: Query<unknown, unknown, unknown>) => void
  onSettled?: (
    data: unknown | undefined,
    error: DefaultError | null,
    query: Query<unknown, unknown, unknown>,
  ) => void
}

interface NotifyEventQueryAdded extends NotifyEvent {
  type: 'added'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryRemoved extends NotifyEvent {
  type: 'removed'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryUpdated extends NotifyEvent {
  type: 'updated'
  query: Query<any, any, any, any>
  action: Action<any, any>
}

interface NotifyEventQueryObserverAdded extends NotifyEvent {
  type: 'observerAdded'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

interface NotifyEventQueryObserverRemoved extends NotifyEvent {
  type: 'observerRemoved'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

interface NotifyEventQueryObserverResultsUpdated extends NotifyEvent {
  type: 'observerResultsUpdated'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryObserverOptionsUpdated extends NotifyEvent {
  type: 'observerOptionsUpdated'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

export type QueryCacheNotifyEvent =
  | NotifyEventQueryAdded
  | NotifyEventQueryRemoved
  | NotifyEventQueryUpdated
  | NotifyEventQueryObserverAdded
  | NotifyEventQueryObserverRemoved
  | NotifyEventQueryObserverResultsUpdated
  | NotifyEventQueryObserverOptionsUpdated

type QueryCacheListener = (event: QueryCacheNotifyEvent) => void

export interface QueryStore {
  has: (queryHash: string) => boolean
  set: (queryHash: string, query: Query) => void
  get: (queryHash: string) => Query | undefined
  delete: (queryHash: string) => void
  values: () => IterableIterator<Query>
}

class RefCountSet<T> {
  #refcounts = new Map<T, number>();

  [Symbol.iterator]() {
    return this.#refcounts.keys()
  }

  get size() {
    return this.#refcounts.size
  }

  add(value: T) {
    const n = this.#refcounts.get(value) ?? 0
    this.#refcounts.set(value, n + 1)
  }

  remove(value: T) {
    let n = this.#refcounts.get(value)
    if (n === undefined) {
      return
    }
    n--
    if (n === 0) {
      this.#refcounts.delete(value)
    } else {
      this.#refcounts.set(value, n)
    }
  }
}

type Primitive = string | number | boolean | bigint | symbol | undefined | null
function isPrimitive(value: unknown): value is Primitive {
  if (value === undefined || value === null) {
    return true
  }
  const t = typeof value
  switch (t) {
    case 'object':
    case 'function':
      return false
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
    case 'undefined':
      return true
    default:
      t satisfies never
      return false
  }
}

/**
 * Like Map<TKey, TValue>, but object keys have value semantics equality based
 * on partialMatchKey, instead of reference equality.
 *
 * Lookups by object are O(NumberOfKeys) instead of O(1).
 *
 * ```ts
 * const queryKeyMap = new QueryKeyElementMap<{ orderBy: 'likes', order: 'desc', limit: 30 }, string>()
 * queryKeyMap.set({ orderBy: 'likes', order: 'desc', limit: 30 }, 'value')
 * queryKeyMap.get({ orderBy: 'likes', order: 'desc', limit: 30 }) // 'value'
 *
 * const vanillaMap = new Map<{ orderBy: 'likes', order: 'desc', limit: 30 }, string>()
 * vanillaMap.set({ orderBy: 'likes', order: 'desc', limit: 30 }, 'value')
 * vanillaMap.get({ orderBy: 'likes', order: 'desc', limit: 30 }) // undefined
 * ```
 */
class QueryKeyElementMap<TKeyElement, TValue> {
  #primitiveMap = new Map<TKeyElement & Primitive, TValue>()
  #objectMap = new Map<TKeyElement & object, TValue>()

  get size() {
    return this.#primitiveMap.size + this.#objectMap.size
  }

  get(
    key: (TKeyElement & Primitive) | (TKeyElement & object),
  ): TValue | undefined {
    if (isPrimitive(key)) {
      return this.#primitiveMap.get(key)
    }

    const matchingKey = this.findMatchingObjectKey(key)
    if (matchingKey) {
      return this.#objectMap.get(matchingKey)
    }

    return undefined
  }

  set(
    key: (TKeyElement & Primitive) | (TKeyElement & object),
    value: TValue,
  ): void {
    if (isPrimitive(key)) {
      this.#primitiveMap.set(key, value)
      return
    }

    const matchingKey = this.findMatchingObjectKey(key)
    this.#objectMap.set(matchingKey ?? key, value)
  }

  delete(key: (TKeyElement & Primitive) | (TKeyElement & object)): boolean {
    if (isPrimitive(key)) {
      return this.#primitiveMap.delete(key)
    }

    const matchingKey = this.findMatchingObjectKey(key)
    if (matchingKey) {
      this.#objectMap.delete(matchingKey)
      return true
    }
    return false
  }

  values(): Iterable<TValue> | undefined {
    if (!this.#primitiveMap.size && !this.#objectMap.size) {
      return undefined
    }

    if (this.#primitiveMap.size && !this.#objectMap.size) {
      return this.#primitiveMap.values()
    }

    if (!this.#primitiveMap.size && this.#objectMap.size) {
      return this.#objectMap.values()
    }

    const primitiveValues = this.#primitiveMap.values()
    const objectValues = this.#objectMap.values()
    return (function* () {
      yield* primitiveValues
      yield* objectValues
    })()
  }

  private findMatchingObjectKey(
    key: TKeyElement & object,
  ): (TKeyElement & object) | undefined {
    // Reference equality
    if (this.#objectMap.has(key)) {
      return key
    }

    // Linear search for the matching key.
    // This makes lookups in the trie O(NumberOfObjectKeys)
    // but it also gives lookups in the trie like
    // `map.get(['a', { obj: true }, 'c'])` the same semantics
    // as `partialMatchKey` itself.
    const keyArray = [key]
    for (const candidateKey of this.#objectMap.keys()) {
      if (partialMatchKey([candidateKey], keyArray)) {
        return candidateKey
      }
    }

    return undefined
  }
}

type QueryKeyTrieNode<TKeyElement, TValue> = {
  /** Element in the query key, QueryKey[number]. */
  key: (TKeyElement & Primitive) | (TKeyElement & object)
  /**
   * Value stored at the end of the path leading to this node.
   * This holds: `key[key.length - 1] === node.key`
   * ```ts
   * map.set(['a', 'b', 'c'], '123')
   * // ->
   * const root = {
   *   children: {
   *     'a': {
   *       key: 'a',
   *       children: {
   *         'b': {
   *           key: 'b',
   *           children: {
   *             'c': {
   *               key: 'c',
   *               value: '123',
   *               insertionOrder: 0,
   *             }
   *           }
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  value?: TValue
  /**
   * Insertion order of the *value* being stored in the trie.
   * Unfortunately the natural iteration order of values in the trie does not
   * match the insertion order, as expected from a map-like data structure.
   *
   * We need to track it explicitly.
   */
  insertionOrder?: number
  /**
   * Children map to the next index element in the queryKey.
   */
  children?: QueryKeyElementMap<
    TKeyElement,
    QueryKeyTrieNode<TKeyElement, TValue>
  >
}

type QueryKeyTrieNodeWithValue<TKeyElement, TValue> = {
  key: (TKeyElement & Primitive) | (TKeyElement & object)
  value: TValue
  insertionOrder: number
  children?: QueryKeyElementMap<
    TKeyElement,
    QueryKeyTrieNode<TKeyElement, TValue>
  >
}

/**
 * We only consider a value to be stored in a node when insertionOrder is defined.
 * This allows storing `undefined` as a value.
 */
function nodeHasValue<TKeyElement, TValue>(
  node: QueryKeyTrieNode<TKeyElement, TValue>,
): node is QueryKeyTrieNodeWithValue<TKeyElement, TValue> {
  return node.insertionOrder !== undefined
}

/**
 * Path length is always 1 greater than the key length, as it includes the root
 * node.
 * ```ts
 * map.set(['a', 'b', 'c'], '123')
 * const path = [root,  n1,  n2,  n3]
 * const key  =       ['a', 'b', 'c']
 */
function traverse<
  TKey extends QueryKey,
  TValue,
  TLookup extends QueryKeyTrieNode<TKey[number], TValue> | undefined,
>(
  root: QueryKeyTrieNode<TKey[number], TValue>,
  key: TKey,
  // May create a child node if needed
  lookup: (
    parent: QueryKeyTrieNode<TKey[number], TValue>,
    key: (TKey[number] & Primitive) | (TKey[number] & object),
  ) => TLookup,
): TLookup extends undefined ? undefined : Array<TLookup | typeof root> {
  const path: Array<QueryKeyTrieNode<TKey[number], TValue>> = [root]
  let node: QueryKeyTrieNode<TKey[number], TValue> | undefined = root
  // In hot code like this data structures, it is best to avoid creating
  // Iterators with for-of loops.
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < key.length; i++) {
    const keyPart = key[i]
    node = lookup(
      node,
      keyPart as (TKey[number] & Primitive) | (TKey[number] & object),
    )
    if (node) {
      path.push(node)
    } else {
      return undefined as never
    }
  }
  return path as never
}

function* iterateSubtreeValueNodes<TKeyElement, TValue>(
  node: QueryKeyTrieNode<TKeyElement, TValue>,
): Generator<QueryKeyTrieNodeWithValue<TKeyElement, TValue>, void, undefined> {
  if (nodeHasValue(node)) {
    yield node
  }

  const children = node.children?.values()
  if (!children) {
    return
  }

  for (const child of children) {
    yield* iterateSubtreeValueNodes(child)
  }
}

class QueryKeyTrie<TKey extends QueryKey, TValue> {
  #root: QueryKeyTrieNode<TKey[number], TValue> = {
    key: undefined,
  }
  // Provides relative insertion ordering between values in the trie.
  #insertionOrder = 0

  set(key: TKey, value: TValue): void {
    const path = traverse(this.#root, key, (parent, keyPart) => {
      parent.children ??= new QueryKeyElementMap()
      let child = parent.children.get(keyPart)
      if (!child) {
        // Note: insertionOrder is for values, not when nodes enter the trie.
        child = { key: keyPart }
        parent.children.set(keyPart, child)
      }
      return child
    })

    const lastNode = path[path.length - 1]!
    if (!nodeHasValue(lastNode)) {
      lastNode.insertionOrder = this.#insertionOrder++
    }
    lastNode.value = value
  }

  delete(key: TKey): void {
    const path = traverse(this.#root, key, (parent, keyPart) =>
      parent.children?.get(keyPart),
    )
    if (!path) {
      return
    }

    const lastNode = path[path.length - 1]!
    if (lastNode.insertionOrder === undefined) {
      // No value stored at key.
      return
    }

    // Drop.
    lastNode.value = undefined
    lastNode.insertionOrder = undefined

    // GC nodes in path that are no longer needed.
    for (let i = path.length - 1; i > 0; i--) {
      const node = path[i]!
      if (nodeHasValue(node) || node.children?.size) {
        // Has data. Do not GC.
        return
      }

      const parent = path[i - 1]
      parent?.children?.delete(node.key)
    }
  }

  /**
   * Returns all values that match the given key:
   * Either the value has the same key and is all primitives,
   * Or the value's key is a suffix of the given key and contains a non-primitive key.
   */
  iteratePrefix(key: TKey): Array<TValue> | undefined {
    const path = traverse(this.#root, key, (parent, keyPart) =>
      parent.children?.get(keyPart),
    )
    if (!path) {
      return undefined
    }

    const lastNode = path[path.length - 1]!
    if (!lastNode.children?.size) {
      // No children - either return value if we have one, or nothing.
      if (nodeHasValue(lastNode)) {
        return [lastNode.value]
      }
      return undefined
    }

    const subtreeInDepthFirstOrder = Array.from(
      iterateSubtreeValueNodes(lastNode),
    )
    return subtreeInDepthFirstOrder
      .sort((a, b) => a.insertionOrder - b.insertionOrder)
      .map((node) => node.value)
  }
}

// CLASS

export class QueryCache extends Subscribable<QueryCacheListener> {
  #queries: QueryStore
  #keyIndex = new QueryKeyTrie<QueryKey, Query>()
  #knownHashFns = new RefCountSet<QueryKeyHashFunction<any>>()

  constructor(public config: QueryCacheConfig = {}) {
    super()
    this.#queries = new Map<string, Query>()
  }

  build<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    client: QueryClient,
    options: WithRequired<
      QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey'
    >,
    state?: QueryState<TData, TError>,
  ): Query<TQueryFnData, TError, TData, TQueryKey> {
    const queryKey = options.queryKey
    const queryHash =
      options.queryHash ?? hashQueryKeyByOptions(queryKey, options)
    let query = this.get<TQueryFnData, TError, TData, TQueryKey>(queryHash)

    if (!query) {
      query = new Query({
        client,
        queryKey,
        queryHash,
        options: client.defaultQueryOptions(options),
        state,
        defaultOptions: client.getQueryDefaults(queryKey),
      })
      this.add(query)
    }

    return query
  }

  add(query: Query<any, any, any, any>): void {
    if (!this.#queries.has(query.queryHash)) {
      this.#queries.set(query.queryHash, query)
      this.#keyIndex.set(query.queryKey, query)
      const hashFn = query.options.queryKeyHashFn
      if (hashFn) {
        this.#knownHashFns.add(hashFn)
      }

      this.notify({
        type: 'added',
        query,
      })
    }
  }

  remove(query: Query<any, any, any, any>): void {
    const queryInMap = this.#queries.get(query.queryHash)

    if (queryInMap) {
      query.destroy()

      if (queryInMap === query) {
        this.#queries.delete(query.queryHash)
        this.#keyIndex.delete(query.queryKey)
        const hashFn = query.options.queryKeyHashFn
        if (hashFn) {
          this.#knownHashFns.remove(hashFn)
        }
      }

      this.notify({ type: 'removed', query })
    }
  }

  clear(): void {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        this.remove(query)
      })
    })
  }

  get<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryHash: string,
  ): Query<TQueryFnData, TError, TData, TQueryKey> | undefined {
    return this.#queries.get(queryHash) as
      | Query<TQueryFnData, TError, TData, TQueryKey>
      | undefined
  }

  getAll(): Array<Query> {
    return [...this.#queries.values()]
  }

  find<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData>(
    filters: WithRequired<QueryFilters, 'queryKey'>,
  ): Query<TQueryFnData, TError, TData> | undefined {
    const defaultedFilters = { exact: true, ...filters }
    if (defaultedFilters.exact) {
      return this.findExact(defaultedFilters)
    }

    const candidates = this.#keyIndex.iteratePrefix(defaultedFilters.queryKey)
    if (!candidates) {
      return undefined
    }

    return candidates.find((query) => matchQuery(defaultedFilters, query)) as
      | Query<TQueryFnData, TError, TData>
      | undefined
  }

  findAll(filters: QueryFilters<any> = {}): Array<Query> {
    if (filters.exact && filters.queryKey) {
      const query = this.findExact(filters)
      return query ? [query] : []
    }

    if (filters.queryKey) {
      const candidates = this.#keyIndex.iteratePrefix(filters.queryKey)
      if (!candidates) {
        return []
      }

      return Object.keys(filters).length > 1
        ? candidates.filter((query) => matchQuery(filters, query))
        : candidates
    }

    const queries = this.getAll()
    return Object.keys(filters).length > 0
      ? queries.filter((query) => matchQuery(filters, query))
      : queries
  }

  private findExact<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
  >(
    filters: QueryFilters<any>,
  ): Query<TQueryFnData, TError, TData> | undefined {
    const tryHashFn = (hashFn: QueryKeyHashFunction<any>) => {
      try {
        const query = this.get(hashFn(filters.queryKey))
        if (query && matchQuery(filters, query)) {
          // Confirmed the query actually uses the hash function we tried
          // and matches the non-queryKey filters
          return query
        } else {
          return undefined
        }
      } catch (error) {
        return undefined
      }
    }

    let query = tryHashFn(hashKey)
    if (!query) {
      for (const hashFn of this.#knownHashFns) {
        query = tryHashFn(hashFn)
        if (query) {
          break
        }
      }
    }

    return query as unknown as Query<TQueryFnData, TError, TData> | undefined
  }

  notify(event: QueryCacheNotifyEvent): void {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  onFocus(): void {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        query.onFocus()
      })
    })
  }

  onOnline(): void {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        query.onOnline()
      })
    })
  }

  onQueryKeyHashFunctionChanged(
    before: QueryKeyHashFunction<any> | undefined,
    after: QueryKeyHashFunction<any> | undefined,
  ): void {
    if (before) {
      this.#knownHashFns.remove(before)
    }
    if (after) {
      this.#knownHashFns.add(after)
    }
  }
}
