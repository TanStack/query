---
id: createAsyncStoragePersistor
title: createAsyncStoragePersistor for React Native (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createAsyncStoragePersistor-experimental` import.

## Usage

- Import the `createAsyncStoragePersistor` function
- Create a new asyncStoragePersistor
- Pass it to the [`persistQueryClient`](../persistQueryClient) function

```ts
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const asyncStoragePersistor = createAsyncStoragePersistor()

persistQueryClient({
  queryClient,
  persistor: asyncStoragePersistor,
})
```

## API

### `createAsyncStoragePersistor`

Call this function (with an optional options object) to create a asyncStoragePersistor that you can use later with `persisteQueryClient`.

```js
createAsyncStoragePersistor(options?: CreateAsyncStoragePersistorOptions)
```

### `Options`

An optional object of options:

```js
interface CreateAsyncStoragePersistorOptions {
  /** The key to use when storing the cache to localstorage */
  asyncStorageKey?: string
  /** To avoid localstorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}
```

The default options are:

```js
{
  asyncStorageKey = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}
```
