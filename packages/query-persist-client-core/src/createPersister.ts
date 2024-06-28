import { matchQuery } from '@tanstack/query-core'
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

export const PERSISTER_KEY_PREFIX = 'tanstack-query'

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
export function experimental_createPersister<TStorageValue = string>({
  storage,
  buster = '',
  maxAge = 1000 * 60 * 60 * 24,
  serialize = JSON.stringify as Required<
    StoragePersisterOptions<TStorageValue>
  >['serialize'],
  deserialize = JSON.parse as Required<
    StoragePersisterOptions<TStorageValue>
  >['deserialize'],
  prefix = PERSISTER_KEY_PREFIX,
  filters,
}: StoragePersisterOptions<TStorageValue>) {
  return async function persisterFn<T, TQueryKey extends QueryKey>(
    queryFn: (context: QueryFunctionContext<TQueryKey>) => T | Promise<T>,
    context: QueryFunctionContext<TQueryKey>,
    query: Query,
  ) {
    const storageKey = `${prefix}-${query.queryHash}`
    const matchesFilter = filters ? matchQuery(filters, query) : true

    // Try to restore only if we do not have any data in the cache and we have persister defined
    if (matchesFilter && query.state.data === undefined && storage != null) {
      try {
        const storedData = await storage.getItem(storageKey)
        if (storedData) {
          const persistedQuery = await deserialize(storedData)

          if (persistedQuery.state.dataUpdatedAt) {
            const queryAge = Date.now() - persistedQuery.state.dataUpdatedAt
            const expired = queryAge > maxAge
            const busted = persistedQuery.buster !== buster
            if (expired || busted) {
              await storage.removeItem(storageKey)
            } else {
              // Just after restoring we want to get fresh data from the server if it's stale
              setTimeout(() => {
                // Set proper updatedAt, since resolving in the first pass overrides those values
                query.setState({
                  dataUpdatedAt: persistedQuery.state.dataUpdatedAt,
                  errorUpdatedAt: persistedQuery.state.errorUpdatedAt,
                })

                if (query.isStale()) {
                  query.fetch()
                }
              }, 0)
              // We must resolve the promise here, as otherwise we will have `loading` state in the app until `queryFn` resolves
              return Promise.resolve(persistedQuery.state.data as T)
            }
          } else {
            await storage.removeItem(storageKey)
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(err)
          console.warn(
            'Encountered an error attempting to restore query cache from persisted location.',
          )
        }
        await storage.removeItem(storageKey)
      }
    }

    // If we did not restore, or restoration failed - fetch
    const queryFnResult = await queryFn(context)

    if (matchesFilter && storage != null) {
      // Persist if we have storage defined, we use timeout to get proper state to be persisted
      setTimeout(async () => {
        storage.setItem(
          storageKey,
          await serialize({
            state: query.state,
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            buster: buster,
          }),
        )
      }, 0)
    }

    return Promise.resolve(queryFnResult)
  }
}
