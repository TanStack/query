import type {
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  QueryState,
} from '@tanstack/query-core'
import { hashQueryKey } from '@tanstack/query-core'

export type Promisable<T> = T | PromiseLike<T>

export interface PersistedQuery {
  buster: string
  timestamp: number
  queryHash: string
  queryKey: QueryKey
  state: QueryState
}

export type PersistRetryer = (props: {
  persistedQuery: PersistedQuery
  error: Error
  errorCount: number
}) => Promisable<PersistedQuery | undefined>

export interface AsyncStorage {
  getItem: (key: string) => Promise<string | undefined | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

export interface StoragePersisterOptions<QC extends QueryClient> {
  // TODO: if we decide to move this to an API layer, we could make this work without passing queryClient
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

export function createPersister<T, QC extends QueryClient>(
  queryFn: () => Promise<T>,
  {
    queryClient,
    storage,
    buster = '',
    maxAge = 1000 * 60 * 60 * 24,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  }: StoragePersisterOptions<QC>,
) {
  return async (context: QueryFunctionContext) => {
    const queryHash = hashQueryKey(context.queryKey)
    const queryState = queryClient.getQueryState(context.queryKey)

    if (!queryState?.data && storage != null) {
      const storedData = await storage.getItem(queryHash)
      if (storedData) {
        const persistedQuery = deserialize(storedData) as PersistedQuery

        if (persistedQuery.timestamp) {
          const expired = Date.now() - persistedQuery.timestamp > maxAge
          const busted = persistedQuery.buster !== buster
          if (expired || busted) {
            await storage.removeItem(queryHash)
          } else {
            queryClient.getQueryCache().build(
              queryClient,
              {
                queryKey: context.queryKey,
                queryHash: queryHash,
              },
              persistedQuery.state,
            )
            return Promise.resolve(persistedQuery.state.data as T)
          }
        } else {
          await storage.removeItem(queryHash)
        }
      }
    }

    const queryFnResult = await queryFn()

    if (storage != null) {
      // TODO: if we decide to move this to an API layer, we could make this work without additional timeout
      setTimeout(() => {
        const newState = queryClient.getQueryState(context.queryKey)

        storage.setItem(
          queryHash,
          serialize({
            state: newState!,
            queryKey: context.queryKey,
            queryHash: queryHash,
            timestamp: Date.now(),
            buster: buster,
          }),
        )
      }, 0)
    }

    return Promise.resolve(queryFnResult)
  }
}
