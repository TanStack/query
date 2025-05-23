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
  - you can pass any `storage` to it that adheres to the `AsyncStorage` or `Storage` interface
- Pass that `persister` as an option to your Query. This can be done either by passing it to the `defaultOptions` of the `QueryClient` or to any `useQuery` hook instance.
  - If you pass this `persister` as `defaultOptions`, all queries will be persisted to the provided `storage`. You can additionally narrow this down by passing `filters`. In contrast to the `persistClient` plugin, this will not persist the whole query client as a single item, but each query separately. As a key, the query hash is used.
  - If you provide this `persister` to a single `useQuery` hook, only this Query will be persisted.

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
   * Filters to narrow down which Queries should be persisted.
   */
  filters?: QueryFilters
}

interface AsyncStorage {
  getItem: (key: string) => Promise<string | undefined | null>
  setItem: (key: string, value: string) => Promise<unknown>
  removeItem: (key: string) => Promise<void>
}
```

The default options are:

```tsx
{
  prefix = 'tanstack-query',
  maxAge = 1000 * 60 * 60 * 24,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}
```
