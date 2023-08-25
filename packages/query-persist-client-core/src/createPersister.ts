import { hashKey } from '@tanstack/query-core'
import type {
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  QueryState,
} from '@tanstack/query-core'

export interface PersistedQuery {
  buster: string
  timestamp: number
  queryHash: string
  queryKey: QueryKey
  state: QueryState
}

export interface AsyncStorage {
  getItem: (key: string) => Promise<string | undefined | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

export interface StoragePersisterOptions<QC extends QueryClient> {
  /**
   * Query Client instance
   */
  queryClient: QC
  /** The storage client used for setting and retrieving items from cache.
   * For SSR pass in `undefined`.
   */
  storage: AsyncStorage | Storage | undefined | null
  /**
   * How to serialize the data to storage.
   * @default `JSON.stringify`
   */
  serialize?: (client: PersistedQuery) => string
  /**
   * How to deserialize the data from storage.
   * @default `JSON.parse`
   */
  deserialize?: (cachedString: string) => PersistedQuery
  /**
   * A unique string that can be used to forcefully invalidate existing caches,
   * if they do not share the same buster string
   */
  buster?: string
  /**
   * The max-allowed age of the cache in milliseconds.
   * If a persisted cache is found that is older than this
   * time, it will be discarded
   */
  maxAge?: number
}

/**
 * Warning: experimental feature.
 * This utility function enables fine-grained query persistance.
 * Simple add it as a `persister` parameter to `useQuery` or `defaultOptions` on `queryClient`.
 * 
 * ```
 * useQuery({
     queryKey: ['myKey'],
     queryFn: fetcher,
     persister: createPersister({
       storage: localStorage,
       queryClient,
     }),
   })
   ```
 */
export function createPersister<T, QC extends QueryClient>({
  queryClient,
  storage,
  buster = '',
  maxAge = 1000 * 60 * 60 * 24,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: StoragePersisterOptions<QC>) {
  return async (
    queryFn: (context: QueryFunctionContext) => T | Promise<T>,
    context: QueryFunctionContext,
  ) => {
    const queryHash = hashKey(context.queryKey)
    const queryState = queryClient.getQueryState(context.queryKey)

    // Try to restore only if we do not have any data in the cache and we have persister defined
    if (!queryState?.data && storage != null) {
      const storedData = await storage.getItem(queryHash)
      if (storedData) {
        const persistedQuery = deserialize(storedData)

        if (persistedQuery.timestamp) {
          const expired = Date.now() - persistedQuery.timestamp > maxAge
          const busted = persistedQuery.buster !== buster
          if (expired || busted) {
            await storage.removeItem(queryHash)
          } else {
            // Just after restoring we want to get fresh data from the server
            // Maybe add an option for this?
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: context.queryKey,
                exact: true,
              })
            }, 0)
            // We must resolve the promise here, as otherwise we will have `loading` state in the app until `queryFn` resolves
            return Promise.resolve(persistedQuery.state.data as T)
          }
        } else {
          await storage.removeItem(queryHash)
        }
      }
    }

    // If we did not restore, or restoration failed - fetch
    const queryFnResult = await queryFn(context)

    if (storage != null) {
      // Persist if we have storage defined
      storage.setItem(
        queryHash,
        serialize({
          state: {
            data: queryFnResult,
            dataUpdateCount: 0,
            dataUpdatedAt: Date.now(),
            status: 'success',
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            fetchStatus: 'idle',
            isInvalidated: false,
          },
          queryKey: context.queryKey,
          queryHash: queryHash,
          timestamp: Date.now(),
          buster: buster,
        }),
      )
    }

    return Promise.resolve(queryFnResult)
  }
}
