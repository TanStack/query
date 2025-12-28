---
id: createAsyncStoragePersister
title: createAsyncStoragePersister
---

## Installation

This utility comes as a separate package and is available under the `'@tanstack/query-async-storage-persister'` import.

```bash
npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

or

```bash
pnpm add @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

or

```bash
yarn add @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

or

```bash
bun add @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

## Usage

- Import the `createAsyncStoragePersister` function
- Create a new asyncStoragePersister
  - you can pass any `storage` to it that adheres to the `AsyncStorage` interface - the example below uses the async-storage from React Native.
  - storages that read and write synchronously, like `window.localstorage`, also adhere to the `AsyncStorage` interface and can therefore also be used with `createAsyncStoragePersister`.
- Wrap your app by using [`PersistQueryClientProvider`](./persistQueryClient.md#persistqueryclientprovider) component.

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

const Root = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister: asyncStoragePersister }}
  >
    <App />
  </PersistQueryClientProvider>
)

export default Root
```

## Retries

Retries work the same as for a [SyncStoragePersister](./createSyncStoragePersister.md), except that they can also be asynchronous. You can also use all the predefined retry handlers.

## API

### `createAsyncStoragePersister`

Call this function to create an asyncStoragePersister that you can use later with `persistQueryClient`.

```tsx
createAsyncStoragePersister(options: CreateAsyncStoragePersisterOptions)
```

### `Options`

```tsx
interface CreateAsyncStoragePersisterOptions {
  /** The storage client used for setting an retrieving items from cache */
  storage: AsyncStorage | undefined | null
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
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}
```
