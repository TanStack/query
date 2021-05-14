---
id: createSessionStoragePersistor
title: createSessionStoragePersistor (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createSessionStoragePersistor-experimental` import.

## Usage

- Import the `createSessionStoragePersistor` function
- Create a new sessionStoragePersistor
- Pass it to the [`persistQueryClient`](../persistQueryClient) function

```ts
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createSessionStoragePersistor } from 'react-query/createSessionStoragePersistor-experimental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const sessionStoragePersistor = createSessionStoragePersistor()

persistQueryClient({
  queryClient,
  persistor: sessionStoragePersistor,
})
```

## API

### `createSessionStoragePersistor`

Call this function (with an optional options object) to create a sessionStoragePersistor that you can use later with `persisteQueryClient`.

```js
createSessionStoragePersistor(options?: CreateSessionStoragePersistorOptions)
```

### `Options`

An optional object of options:

```js
interface CreateSessionStoragePersistorOptions {
  /** The key to use when storing the cache to sessionstorage */
  sessionStorageKey?: string
  /** To avoid sessionstorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}
```

The default options are:

```js
{
  sessionStorageKey = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}
```
