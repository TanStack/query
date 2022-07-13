---
id: createAsyncStoragePersister
title: createAsyncStoragePersister
---

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createAsyncStoragePersister` import.

## Usage

- Import the `createAsyncStoragePersister` function
- Create a new asyncStoragePersister
  - you can pass any `storage` to it that adheres to the `AsyncStorage` interface - the example below uses the async-storage from React Native
- Pass it to the [`persistQueryClient`](./persistQueryClient) function

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-async-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage
})

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
})
```

## Retries

Retries work the same as for a [SyncStoragePersister](./createSyncStoragePersister), except that they can also be asynchronous. You can also use all the predefined retry handlers.

## API

### `createAsyncStoragePersister`

Call this function to create an asyncStoragePersister that you can use later with `persistQueryClient`.

```js
createAsyncStoragePersister(options: CreateAsyncStoragePersisterOptions)
```

### `Options`

```ts
interface CreateAsyncStoragePersisterOptions {
  /** The storage client used for setting an retrieving items from cache */
  storage: AsyncStorage
  /** The key to use when storing the cache to localStorage */
  key?: string
  /** To avoid localStorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
  /** How to serialize the data to storage */
  serialize?: (client: PersistedClient) => string
  /** How to deserialize the data from storage */
  deserialize?: (cachedString: string) => PersistedClient
  /** How to retry persistence on error **/
  retry?: AsyncPersistRetryer
}

interface AsyncStorage {
  getItem: (key: string) => Promise<string>
  setItem: (key: string, value: string) => Promise<unknown>
  removeItem: (key: string) => Promise<unknown>
}
```

The default options are:

```js
{
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}
```
