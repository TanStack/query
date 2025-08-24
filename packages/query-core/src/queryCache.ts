import { hashKey, hashQueryKeyByOptions, matchQuery } from './utils'
import { Query, RefCountSet, allQueryKeyHashFns } from './query'
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

type MapTrieNode<TValue> = {
  key: Primitive
  /**
   * - Entries who's TKey path leads exactly to this node,
   *   therefor their path is all primitives.
   *   ourPath = [p1, p2, p3, ...pN]
   *   theirPath = [p1, p2, p3, ...pN]
   */
  exact?: RefCountSet<TValue>
  /**
   * - Entries who's path after this point contains non-primitive keys.
   *   Such entries cannot be looked up by value deeper in the trie.
   *   Implies their TKey path != this node's keyPath.
   *   ourPath = [p1, p2, p3, ...pN]
   *   theirPath = [p1, p2, p3, ...pN, nonPrimitive, ...]
   */
  nonPrimitiveSuffix?: RefCountSet<TValue>
  /** Child nodes storing entries who's TKey path is prefixed with this node's path. */
  children?: Map<Primitive, MapTrieNode<TValue>>
}

/** Path length is always 1 greater than the key length, as it includes the root node. */
function traverse<TValue>(
  root: MapTrieNode<TValue>,
  key: QueryKey,
  // May create a child node if needed
  lookup: (
    parent: MapTrieNode<TValue>,
    key: Primitive,
  ) => MapTrieNode<TValue> | undefined,
): Array<MapTrieNode<TValue>> {
  const path: Array<MapTrieNode<TValue>> = [root]
  let node: MapTrieNode<TValue> | undefined = root
  for (let i = 0; i < key.length && node; i++) {
    const keyPart = key[i]
    if (isPrimitive(keyPart)) {
      node = lookup(node, keyPart)
    } else {
      node = undefined
    }
    if (node) {
      path.push(node)
    }
  }
  return path
}

function gcPath(path: Array<MapTrieNode<any>>): void {
  if (path.length === 0) {
    return
  }
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i]
    if (!node) {
      throw new Error('Should never occur (bug in MapTrie)')
    }

    if (
      node.exact?.size ||
      node.nonPrimitiveSuffix?.size ||
      node.children?.size
    ) {
      // Has data. Do not GC.
      return
    }

    const parent = path[i - 1]
    parent?.children?.delete(node.key)
  }
}

class MapTrieSet<TKey extends QueryKey, TValue> {
  #root: MapTrieNode<TValue> = {
    key: undefined,
  }

  add(key: TKey, value: TValue): void {
    const path = traverse(this.#root, key, (parent, keyPart) => {
      parent.children ??= new Map()
      let child = parent.children.get(keyPart)
      if (!child) {
        child = { key: keyPart }
        parent.children.set(keyPart, child)
      }
      return child
    })
    const lastPathNode = path[path.length - 1]
    if (!lastPathNode) {
      throw new Error('Should never occur (bug in MapTrie)')
    }

    if (key.length === path.length - 1) {
      lastPathNode.exact ??= new RefCountSet()
      lastPathNode.exact.add(value)
    } else {
      lastPathNode.nonPrimitiveSuffix ??= new RefCountSet()
      lastPathNode.nonPrimitiveSuffix.add(value)
    }
  }

  remove(key: TKey, value: TValue): void {
    const path = traverse(this.#root, key, (parent, keyPart) =>
      parent.children?.get(keyPart),
    )
    const lastPathNode = path[path.length - 1]
    if (!lastPathNode) {
      throw new Error('Should never occur (bug in MapTrie)')
    }
    if (key.length === path.length - 1) {
      lastPathNode.exact?.remove(value)
      gcPath(path)
    } else if (!isPrimitive(key[path.length - 1])) {
      lastPathNode.nonPrimitiveSuffix?.remove(value)
      gcPath(path)
    }
  }

  /**
   * Returns all values that match the given key:
   * Either the value has the same key and is all primitives,
   * Or the value's key is a suffix of the given key and contains a non-primitive key.
   */
  getByPrefix(key: TKey): Iterable<TValue> | undefined {
    let miss = false
    const path = traverse(this.#root, key, (parent, keyPart) => {
      const child = parent.children?.get(keyPart)
      if (!child) {
        miss = true
        return undefined
      }
      return child
    })
    // Failed to look up one of the primitive keys in the path.
    // This means there's no match at all.
    // Appears to be incorrectly reported by @typescript-eslint as always false :\
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (miss) {
      return undefined
    }

    const lastNode = path[path.length - 1]
    if (!lastNode) {
      throw new Error('Should never occur (bug in MapTrie)')
    }

    // If the `key` is all primitives then we need to recurse to find all values
    // that match the prefix, as these values will be stored deeper in the trie.
    //
    // If the `key` contains a non-primitive part after the returned path,
    // then all possible values that have the suffix are stored in this node.
    const isPrimitivePath = path.length - 1 === key.length
    if (!isPrimitivePath) {
      return lastNode.nonPrimitiveSuffix?.[Symbol.iterator]()
    }

    // See if we can avoid instantiating a generator
    if (
      !lastNode.children &&
      (lastNode.exact || lastNode.nonPrimitiveSuffix) &&
      !(lastNode.exact && lastNode.nonPrimitiveSuffix)
    ) {
      return lastNode.exact ?? lastNode.nonPrimitiveSuffix
    }

    return (function* depthFirstPrefixIterator() {
      const queue = [lastNode]
      while (queue.length > 0) {
        const node = queue.pop()!
        if (node.exact) {
          yield* node.exact
        }
        if (node.nonPrimitiveSuffix) {
          yield* node.nonPrimitiveSuffix
        }
        if (node.children) {
          for (const child of node.children.values()) {
            queue.push(child)
          }
        }
      }
    })()
  }
}

// CLASS

export class QueryCache extends Subscribable<QueryCacheListener> {
  #queries: QueryStore
  #keyIndex = new MapTrieSet<QueryKey, Query>()

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
      this.#keyIndex.add(query.queryKey, query)

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
        this.#keyIndex.remove(query.queryKey, query)
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
      return this.findExact(filters)
    }

    const candidates = this.#keyIndex.getByPrefix(filters.queryKey)
    if (!candidates) {
      return undefined
    }

    for (const query of candidates) {
      if (matchQuery(defaultedFilters, query)) {
        return query as unknown as
          | Query<TQueryFnData, TError, TData>
          | undefined
      }
    }

    return undefined
  }

  findAll(filters: QueryFilters<any> = {}): Array<Query> {
    if (filters.exact && filters.queryKey) {
      const query = this.findExact(filters)
      return query ? [query] : []
    }

    if (filters.queryKey) {
      const withPrefix = this.#keyIndex.getByPrefix(filters.queryKey)
      const candidates = withPrefix ? Array.from(withPrefix) : []
      return candidates.filter((query) => matchQuery(filters, query))
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
      for (const hashFn of allQueryKeyHashFns) {
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
}
