---
id: createPersister
title: experimental_createPersister
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

## Usage

- Import the `experimental_createPersister` function
- Create a new `experimental_createPersister`
  - you can pass any `storage` to it that adheres to the `AsyncStorage` or `Storage` interface - the example below uses the async-storage from React Native

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { experimental_createPersister } from '@tanstack/query-persist-client-core'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      persister: experimental_createPersister({
        storage: AsyncStorage,
      }),
    },
  },
})
```

## API

### `experimental_createPersister`

Call this function to create a `persister` that you can pass to `defaultOptions` of `QueryClient` or to any `useQuery` hook.  
If you pass this `persister` as `defaultOptions`, all queries will be persisted to provided `storage`.  
If you provide this `persister` to `useQuery` hook, currently active `query` will be persisted.  
This way, you do not need to store whole query client, but choose what is worth to be persisted in your application.  
Each query is lazily restored and persisted, so it does not need to be throttled.

```tsx
experimental_createPersister(options: StoragePersisterOptions)
```

### `Options`

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
   */
  maxAge?: number
  /**
   * Prefix to be used for storage key.
   * Storage key is a combination of prefix and query hash in a form of `prefix-queryHash`.
   */
  prefix?: string
  /**
   * Filter function returning whether current query should be restored/persisted.
   */
  queryFilter?: (queryKey: QueryKey, query: Query) => boolean
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
