import { hashKey } from '@tanstack/query-core'
import type {
  QueryClient,
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
export function experimental_createPersister<T, QC extends QueryClient>({
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

    if (queryState?.data === undefined && storage != null) {
      try {
        const storedData = await storage.getItem(queryHash)
        if (storedData) {
          const persistedQuery = deserialize(storedData)

          if (persistedQuery.state.dataUpdatedAt) {
            const queryAge = Date.now() - persistedQuery.state.dataUpdatedAt
            const expired = queryAge > maxAge
            const busted = persistedQuery.buster !== buster
            if (expired || busted) {
              await storage.removeItem(queryHash)
            } else {
              // TODO: how do we get staleTime here?
              const isStale = queryAge > 5000
              // Just after restoring we want to get fresh data from the server if it's stale
              if (isStale) {
                setTimeout(() => {
                  queryClient.refetchQueries({
                    queryKey: context.queryKey,
                    exact: true,
                  })
                }, 0)
              }
              // We must resolve the promise here, as otherwise we will have `loading` state in the app until `queryFn` resolves
              return Promise.resolve(persistedQuery.state.data as T)
            }
          } else {
            await storage.removeItem(queryHash)
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(err)
          console.warn(
            'Encountered an error attempting to restore query cache from persisted location.',
          )
        }
      }
    }

    // If we did not restore, or restoration failed - fetch
    const queryFnResult = await queryFn(context)

    if (storage != null) {
      // Persist if we have storage defined, we use timeout to get proper state to be persisted
      setTimeout(() => {
        const newState = queryClient.getQueryState(context.queryKey)

        if (newState) {
          storage.setItem(
            queryHash,
            serialize({
              state: newState,
              queryKey: context.queryKey,
              queryHash: queryHash,
              buster: buster,
            }),
          )
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              'Could not persist query to storage, cause query state was not found in cache.',
            )
          }
        }
      }, 0)
    }

    return Promise.resolve(queryFnResult)
  }
}
