---
id: createPersister
title: experimental_createQueryPersister
---

## Installation

This utility comes as a separate package and is available under the `'@tanstack/query-persist-client-core'` import.

```bash
npm install @tanstack/query-persist-client-core
```

or

```bash
pnpm add @tanstack/query-persist-client-core
```

or

```bash
yarn add @tanstack/query-persist-client-core
```

or

```bash
bun add @tanstack/query-persist-client-core
```

## Usage

- Import the `experimental_createQueryPersister` function
- Create a new `experimental_createQueryPersister`
  - you can pass any `storage` to it that adheres to the `AsyncStorage` interface
- Pass that `persister` as an option to your Query. This can be done either by passing it to the `defaultOptions` of the `QueryClient` or to any `useQuery` hook instance.
  - If you pass this `persister` as `defaultOptions`, all queries will be persisted to the provided `storage`. You can additionally narrow this down by passing `filters`. In contrast to the `persistClient` plugin, this will not persist the whole query client as a single item, but each query separately. As a key, the query hash is used.
  - If you provide this `persister` to a single `useQuery` hook, only this Query will be persisted.
- Note: `queryClient.setQueryData()` operations are not persisted, this means that if you perform an optimistic update and refresh the page before the query has been invalidated, your changes to the query data will be lost. See https://github.com/TanStack/query/issues/6310

This way, you do not need to store whole `QueryClient`, but choose what is worth to be persisted in your application. Each query is lazily restored (when the Query is first used) and persisted (after each run of the `queryFn`), so it does not need to be throttled. `staleTime` is also respected after restoring the Query, so if data is considered `stale`, it will be refetched immediately after restoring. If data is `fresh`, the `queryFn` will not run.

Garbage collecting a Query from memory **does not** affect the persisted data. That means Queries can be kept in memory for a shorter period of time to be more **memory efficient**. If they are used the next time, they will just be restored from the persistent storage again.

```tsx
import { QueryClient } from '@tanstack/vue-query'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'

const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: 1000 * 60 * 60 * 12, // 12 hours
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 30, // 30 seconds
      persister: persister.persisterFn,
    },
  },
})
```

### Adapted defaults

The `createPersister` plugin technically wraps the `queryFn`, so it doesn't restore if the `queryFn` doesn't run. In that way, it acts as a caching layer between the Query and the network. Thus, the `networkMode` defaults to `'offlineFirst'` when a persister is used, so that restoring from the persistent storage can also happen even if there is no network connection.

## Additional utilities

Invoking `experimental_createQueryPersister` returns additional utilities in addition to `persisterFn` for easier implementation of userland functionalities.

### `persistQueryByKey(queryKey: QueryKey, queryClient: QueryClient): Promise<void>`

This function will persist `Query` to storage and key defined when creating persister.  
This utility might be used along `setQueryData` to persist optimistic update to storage without waiting for invalidation.

```tsx
const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: 1000 * 60 * 60 * 12, // 12 hours
})

const queryClient = useQueryClient()

useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    ...
    // Optimistically update to the new value
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    // And persist it to storage
    persister.persistQueryByKey(['todos'], queryClient)
    ...
  },
})
```

### `retrieveQuery<T>(queryHash: string): Promise<T | undefined>`

This function would attempt to retrieve persisted query by `queryHash`.  
If `query` is `expired`, `busted` or `malformed` it would be removed from the storage instead, and `undefined` would be returned.

### `persisterGc(): Promise<void>`

This function can be used to sporadically clean up stoage from `expired`, `busted` or `malformed` entries.

For this function to work, your storage must expose `entries` method that would return a `key-value tuple array`.  
For example `Object.entries(localStorage)` for `localStorage` or `entries` from `idb-keyval`.

### `restoreQueries(queryClient: QueryClient, filters): Promise<void>`

This function can be used to restore queries that are currently stored by persister.  
For example when your app is starting up in offline mode, or you want all or only specific data from previous session to be immediately available without intermediate `loading` state.

The filter object supports the following properties:

- `queryKey?: QueryKey`
  - Set this property to define a query key to match on.
- `exact?: boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed.

For this function to work, your storage must expose `entries` method that would return a `key-value tuple array`.  
For example `Object.entries(localStorage)` for `localStorage` or `entries` from `idb-keyval`.

## API

### `experimental_createQueryPersister`

```tsx
experimental_createQueryPersister(options: StoragePersisterOptions)
```

#### `Options`

```tsx
export interface StoragePersisterOptions {
  /** The storage client used for setting and retrieving items from cache.
   * For SSR pass in `undefined`.
   */
  storage: AsyncStorage | Storage | undefined | null
  /**
   * How to serialize the data to storage.
   * @default `JSON.stringify`
   */
  serialize?: (persistedQuery: PersistedQuery) => string
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
   * @default 24 hours
   */
  maxAge?: number
  /**
   * Prefix to be used for storage key.
   * Storage key is a combination of prefix and query hash in a form of `prefix-queryHash`.
   */
  prefix?: string
  /**
   * If set to `true`, the query will refetch on successful query restoration if the data is stale.
   * If set to `false`, the query will not refetch on successful query restoration.
   * If set to `'always'`, the query will always refetch on successful query restoration.
   * Defaults to `true`.
   */
  refetchOnRestore?: boolean | 'always'
  /**
   * Filters to narrow down which Queries should be persisted.
   */
  filters?: QueryFilters
}

interface AsyncStorage<TStorageValue = string> {
  getItem: (key: string) => MaybePromise<TStorageValue | undefined | null>
  setItem: (key: string, value: TStorageValue) => MaybePromise<unknown>
  removeItem: (key: string) => MaybePromise<void>
  entries?: () => MaybePromise<Array<[key: string, value: TStorageValue]>>
}
```

The default options are:

```tsx
{
  prefix = 'tanstack-query',
  maxAge = 1000 * 60 * 60 * 24,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  refetchOnRestore = true,
}
```
