---
id: createWebStoragePersistor
title: createWebStoragePersistor (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createWebStoragePersistor-experimental` import.

## Usage

- Import the `createWebStoragePersistor` function
- Create a new webStoragePersistor
- Pass it to the [`persistQueryClient`](../persistQueryClient) function

```ts
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const localStoragePersistor = createWebStoragePersistor({ storage: window.localStorage })
// const sessionStoragePersistor = createWebStoragePersistor({ storage: window.sessionStorage })

persistQueryClient({
  queryClient,
  persistor: localStoragePersistor,
})
```

## API

### `createWebStoragePersistor`

Call this function to create a webStoragePersistor that you can use later with `persistQueryClient`.

```js
createWebStoragePersistor(options: CreateWebStoragePersistorOptions)
```

### `Options`

```ts
interface CreateWebStoragePersistorOptions {
  /** The storage client used for setting an retrieving items from cache (window.localStorage or window.sessionStorage) */
  storage: Storage
  /** The key to use when storing the cache */
  key?: string
  /** To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}
```

The default options are:

```js
{
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}
```
