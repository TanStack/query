---
id: createLocalStoragePersistor
title: createLocalStoragePersistor (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createLocalStoragePersistor-experimental` import.

## Usage

- Import the `createLocalStoragePersistor` function
- Create a new localStoragePersistor
- Pass it to the [`persistQueryClient`](../persistQueryClient) function

```ts
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createLocalStoragePersistor } from 'react-query/createLocalStoragePersistor-experimental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const localStoragePersistor = createLocalStoragePersistor()

persistQueryClient({
  queryClient,
  persistor: localStoragePersistor,
})
```

## API

### `createLocalStoragePersistor`

Call this function (with an optional options object) to create a localStoragePersistor that you can use later with `persisteQueryClient`.

```js
createLocalStoragePersistor(options?: CreateLocalStoragePersistorOptions)
```

### `Options`

An optional object of options:

```js
interface CreateLocalStoragePersistorOptions {
  /** The key to use when storing the cache to localstorage */
  localStorageKey?: string
  /** To avoid localstorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}
```

The default options are:

```js
{
  localStorageKey = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}
```
