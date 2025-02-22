import type {
  Query,
  QueryFilters,
  QueryFunctionContext,
  QueryKey,
  QueryState,
} from '@tanstack/query-core'
export interface PersistedQuery {
  buster: string
  queryHash: string
  queryKey: QueryKey
  state: QueryState
}
export type MaybePromise<T> = T | Promise<T>
export interface AsyncStorage<TStorageValue = string> {
  getItem: (key: string) => MaybePromise<TStorageValue | undefined | null>
  setItem: (key: string, value: TStorageValue) => MaybePromise<unknown>
  removeItem: (key: string) => MaybePromise<void>
}
export interface StoragePersisterOptions<TStorageValue = string> {
  /** The storage client used for setting and retrieving items from cache.
   * For SSR pass in `undefined`.
   */
  storage: AsyncStorage<TStorageValue> | undefined | null
  /**
   * How to serialize the data to storage.
   * @default `JSON.stringify`
   */
  serialize?: (persistedQuery: PersistedQuery) => MaybePromise<TStorageValue>
  /**
   * How to deserialize the data from storage.
   * @default `JSON.parse`
   */
  deserialize?: (cachedString: TStorageValue) => MaybePromise<PersistedQuery>
  /**
   * A unique string that can be used to forcefully invalidate existing caches,
   * if they do not share the same buster string
   */
  buster?: string
  /**
   * The max-allowed age of the cache in milliseconds.
   * If a persisted cache is found that is older than this
   * time, it will be discarded
   * @default 24 hours
   */
  maxAge?: number
  /**
   * Prefix to be used for storage key.
   * Storage key is a combination of prefix and query hash in a form of `prefix-queryHash`.
   * @default 'tanstack-query'
   */
  prefix?: string
  /**
   * Filters to narrow down which Queries should be persisted.
   */
  filters?: QueryFilters
}
export declare const PERSISTER_KEY_PREFIX = 'tanstack-query'
/**
 * Warning: experimental feature.
 * This utility function enables fine-grained query persistence.
 * Simple add it as a `persister` parameter to `useQuery` or `defaultOptions` on `queryClient`.
 *
 * ```
 * useQuery({
     queryKey: ['myKey'],
     queryFn: fetcher,
     persister: createPersister({
       storage: localStorage,
     }),
   })
   ```
 */
export declare function experimental_createPersister<TStorageValue = string>({
  storage,
  buster,
  maxAge,
  serialize,
  deserialize,
  prefix,
  filters,
}: StoragePersisterOptions<TStorageValue>): <T, TQueryKey extends QueryKey>(
  queryFn: (context: QueryFunctionContext<TQueryKey>) => T | Promise<T>,
  context: QueryFunctionContext<TQueryKey>,
  query: Query,
) => Promise<T>
//# sourceMappingURL=createPersister.d.ts.map
