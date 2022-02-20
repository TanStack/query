---
id: createAsyncStoragePersistor
title: createAsyncStoragePersistor (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createAsyncStoragePersistor-experimental` import.

## Usage

- Import the `createAsyncStoragePersistor` function
- Create a new asyncStoragePersistor
  - you can pass any `storage` to it that adheres to the `AsyncStorage` interface - the example below uses the async-storage from React Native
- Pass it to the [`persistQueryClient`](./persistQueryClient) function

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const asyncStoragePersistor = createAsyncStoragePersistor({
  storage: AsyncStorage
})

persistQueryClient({
  queryClient,
  persistor: asyncStoragePersistor,
})
```

## API

### `createAsyncStoragePersistor`

Call this function to create an asyncStoragePersistor that you can use later with `persistQueryClient`.

```js
createAsyncStoragePersistor(options: CreateAsyncStoragePersistorOptions)
```

### `Options`

```ts
interface CreateAsyncStoragePersistorOptions {
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
